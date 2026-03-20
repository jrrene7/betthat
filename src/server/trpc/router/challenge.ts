import { TRPCError } from "@trpc/server";
import { TransactionType, Visibility } from "@prisma/client";
import { protectedProcedure, publicProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

function parseOptionalDate(value: string | null | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid date value." });
  }
  return date;
}

const challengeInclude = {
  creator: true,
  participants: { include: { user: true } },
  _count: { select: { participants: true, submissions: true, bets: true } },
} as const;

const submissionInclude = {
  user: { select: { id: true, name: true, image: true } },
  votes: true,
  _count: { select: { votes: true } },
} as const;

export const challengeRouter = router({
  createChallenge: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(150),
        description: z.string().trim().max(5000).optional().nullable(),
        participantIds: z.array(z.string()).max(20).optional(),
        startsAt: z.string().optional().nullable(),
        endsAt: z.string().optional().nullable(),
        wagerAmount: z.number().int().min(0).max(100000).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startsAt = parseOptionalDate(input.startsAt);
      const endsAt = parseOptionalDate(input.endsAt);
      if (startsAt && endsAt && startsAt > endsAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge start date must be before end date." });
      }
      const participantIds = Array.from(
        new Set((input.participantIds ?? []).filter((id) => id !== ctx.session.user.id))
      );
      if (participantIds.length > 0) {
        const foundUsers = await ctx.prisma.user.findMany({
          where: { id: { in: participantIds } },
          select: { id: true },
        });
        if (foundUsers.length !== participantIds.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "One or more selected participants do not exist." });
        }
      }
      if (input.wagerAmount > 0) {
        const creator = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { balance: true },
        });
        if (!creator || creator.balance < input.wagerAmount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance for this wager." });
        }
      }
      const challenge = await ctx.prisma.challenge.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          creatorId: ctx.session.user.id,
          startsAt,
          endsAt,
          wagerAmount: input.wagerAmount,
          participants: {
            create: [
              { userId: ctx.session.user.id },
              ...participantIds.map((userId) => ({ userId })),
            ],
          },
        },
        include: challengeInclude,
      });
      if (input.wagerAmount > 0) {
        await ctx.prisma.$transaction([
          ctx.prisma.user.update({
            where: { id: ctx.session.user.id },
            data: { balance: { decrement: input.wagerAmount } },
          }),
          ctx.prisma.pointTransaction.create({
            data: {
              userId: ctx.session.user.id,
              amount: -input.wagerAmount,
              type: TransactionType.BET_PLACED,
              description: `Challenge wager: ${challenge.title}`,
            },
          }),
        ]);
      }
      return { challenge };
    }),

  getPublicChallenges: publicProcedure
    .input(z.object({ skip: z.number().default(0), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const challenges = await ctx.prisma.challenge.findMany({
        where: { NOT: { visibility: { in: [Visibility.UNLISTED, Visibility.PRIVATE] } } },
        include: challengeInclude,
        orderBy: { createdAt: "desc" },
        skip: input.skip,
        take: input.limit,
      });
      return { challenges };
    }),

  getChallenge: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.id },
        include: challengeInclude,
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found." });

      const userId = ctx.session?.user?.id;
      const isParticipant = challenge.participants.some((p) => p.userId === userId);
      if (challenge.visibility !== Visibility.PUBLIC && !isParticipant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This challenge is private." });
      }
      return { challenge };
    }),

  getUserChallenges: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const viewerId = ctx.session?.user?.id;
      const isOwnProfile = viewerId === input.userId;

      const challenges = await ctx.prisma.challenge.findMany({
        where: {
          participants: { some: { userId: input.userId } },
          ...(!isOwnProfile ? { visibility: { in: ["PUBLIC", "UNLISTED"] } } : {}),
        },
        include: challengeInclude,
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return { challenges };
    }),

  inviteParticipants: protectedProcedure
    .input(z.object({
      challengeId: z.string(),
      userIds: z.array(z.string()).min(1).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: { creatorId: true, participants: { select: { userId: true } } },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      if (challenge.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can invite participants." });
      }
      const existingIds = new Set(challenge.participants.map((p) => p.userId));
      const newUserIds = input.userIds.filter((id) => !existingIds.has(id));
      if (newUserIds.length === 0) return { added: 0 };
      await ctx.prisma.challengeParticipant.createMany({
        data: newUserIds.map((userId) => ({ challengeId: input.challengeId, userId })),
      });
      return { added: newUserIds.length };
    }),

  updateVisibility: protectedProcedure
    .input(z.object({
      challengeId: z.string(),
      visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: { creatorId: true },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      if (challenge.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can change visibility." });
      }
      const updated = await ctx.prisma.challenge.update({
        where: { id: input.challengeId },
        data: { visibility: input.visibility as Visibility },
        include: challengeInclude,
      });
      return { challenge: updated };
    }),

  // --- Submissions ---

  submitToChallenge: protectedProcedure
    .input(z.object({
      challengeId: z.string(),
      content: z.string().trim().max(2000).optional().nullable(),
      mediaUrl: z.string().url().optional().nullable(),
    }).refine((d) => !!(d.content || d.mediaUrl), {
      message: "Submission must have content or media.",
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: { status: true, participants: { select: { userId: true } } },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      const isParticipant = challenge.participants.some((p) => p.userId === ctx.session.user.id);
      if (!isParticipant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only participants can submit." });
      }
      if (!["OPEN", "ACTIVE"].includes(challenge.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge is not accepting submissions." });
      }
      const submission = await ctx.prisma.challengeSubmission.create({
        data: {
          challengeId: input.challengeId,
          userId: ctx.session.user.id,
          content: input.content?.trim() || null,
          imageUrl: input.mediaUrl || null,
        },
        include: submissionInclude,
      });
      return { submission };
    }),

  getSubmissions: publicProcedure
    .input(z.object({ challengeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: { visibility: true, participants: { select: { userId: true } } },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });

      const userId = ctx.session?.user?.id;
      const isParticipant = challenge.participants.some((p) => p.userId === userId);
      if (challenge.visibility === Visibility.PRIVATE && !isParticipant) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const submissions = await ctx.prisma.challengeSubmission.findMany({
        where: { challengeId: input.challengeId },
        include: submissionInclude,
        orderBy: { createdAt: "desc" },
      });
      return { submissions };
    }),

  voteOnSubmission: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      approved: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.prisma.challengeSubmission.findUnique({
        where: { id: input.submissionId },
        select: { userId: true },
      });
      if (!submission) throw new TRPCError({ code: "NOT_FOUND" });
      if (submission.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot vote on your own submission." });
      }
      await ctx.prisma.submissionVote.upsert({
        where: { submissionId_voterId: { submissionId: input.submissionId, voterId: ctx.session.user.id } },
        create: { submissionId: input.submissionId, voterId: ctx.session.user.id, approved: input.approved },
        update: { approved: input.approved },
      });
      return { ok: true };
    }),
});
