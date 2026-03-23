import { TRPCError } from "@trpc/server";
import { InviteStatus, NotificationType, TransactionType, Visibility } from "@prisma/client";
import { protectedProcedure, publicProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";
import logger from "src/server/logger";

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
  winner: { select: { id: true, name: true, image: true } },
  participants: { include: { user: true } },
  _count: { select: { submissions: true, bets: true } },
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
              { userId: ctx.session.user.id, inviteStatus: InviteStatus.ACCEPTED },
              ...participantIds.map((userId) => ({ userId, inviteStatus: InviteStatus.PENDING })),
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
              type: TransactionType.CHALLENGE_ENTRY,
              description: `Challenge entry: ${challenge.title}`,
            },
          }),
        ]);
      }
      logger.info("challenge.created", { challengeId: challenge.id, creatorId: ctx.session.user.id, wagerAmount: input.wagerAmount, participantCount: participantIds.length });
      // Notify invited participants
      if (participantIds.length > 0) {
        await ctx.prisma.notification.createMany({
          data: participantIds.map((userId) => ({
            userId,
            actorId: ctx.session.user.id,
            type: NotificationType.CHALLENGE_INVITED,
            entityId: challenge.id,
            entityType: "challenge",
            message: `invited you to join "${challenge.title}"`,
          })),
        });
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
          participants: { some: { userId: input.userId, inviteStatus: InviteStatus.ACCEPTED } },
          ...(!isOwnProfile ? { visibility: { in: ["PUBLIC", "UNLISTED"] } } : {}),
        },
        include: challengeInclude,
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return { challenges };
    }),

  updateChallenge: protectedProcedure
    .input(z.object({
      challengeId: z.string(),
      title: z.string().trim().min(1).max(150),
      description: z.string().trim().max(5000).optional().nullable(),
      startsAt: z.string().optional().nullable(),
      endsAt: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: { creatorId: true, status: true },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      if (challenge.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can edit this challenge." });
      }
      if (["COMPLETED", "CANCELLED"].includes(challenge.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot edit a completed challenge." });
      }
      const startsAt = parseOptionalDate(input.startsAt);
      const endsAt = parseOptionalDate(input.endsAt);
      if (startsAt && endsAt && startsAt > endsAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Start date must be before end date." });
      }
      const updated = await ctx.prisma.challenge.update({
        where: { id: input.challengeId },
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          startsAt,
          endsAt,
        },
        include: challengeInclude,
      });
      return { challenge: updated };
    }),

  joinChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: {
          id: true,
          title: true,
          status: true,
          visibility: true,
          wagerAmount: true,
          creatorId: true,
          participants: { select: { userId: true } },
        },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      if (challenge.visibility === Visibility.PRIVATE) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This challenge is private." });
      }
      if (["COMPLETED", "CANCELLED"].includes(challenge.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge is no longer accepting participants." });
      }
      const alreadyIn = challenge.participants.some((p) => p.userId === ctx.session.user.id);
      if (alreadyIn) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You are already a participant." });
      }
      if (challenge.wagerAmount > 0) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { balance: true },
        });
        if (!user || user.balance < challenge.wagerAmount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance to join this challenge." });
        }
      }
      await ctx.prisma.challengeParticipant.create({
        data: { challengeId: input.challengeId, userId: ctx.session.user.id },
      });
      if (challenge.wagerAmount > 0) {
        await ctx.prisma.$transaction([
          ctx.prisma.user.update({
            where: { id: ctx.session.user.id },
            data: { balance: { decrement: challenge.wagerAmount } },
          }),
          ctx.prisma.pointTransaction.create({
            data: {
              userId: ctx.session.user.id,
              amount: -challenge.wagerAmount,
              type: TransactionType.CHALLENGE_ENTRY,
              description: `Challenge entry: ${challenge.title}`,
            },
          }),
        ]);
      }
      logger.info("challenge.joined", { challengeId: input.challengeId, userId: ctx.session.user.id, wagerAmount: challenge.wagerAmount });
      // Notify creator
      await ctx.prisma.notification.create({
        data: {
          userId: challenge.creatorId,
          actorId: ctx.session.user.id,
          type: NotificationType.CHALLENGE_JOINED,
          entityId: challenge.id,
          entityType: "challenge",
          message: `joined your challenge "${challenge.title}"`,
        },
      });
      return { ok: true };
    }),

  completeChallenge: protectedProcedure
    .input(z.object({
      challengeId: z.string(),
      winnerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: {
          id: true,
          title: true,
          creatorId: true,
          status: true,
          wagerAmount: true,
          participants: { select: { userId: true, inviteStatus: true } },
        },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      if (challenge.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can complete this challenge." });
      }
      if (["COMPLETED", "CANCELLED"].includes(challenge.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge is already finished." });
      }
      const isValidWinner = challenge.participants.some((p) => p.userId === input.winnerId && p.inviteStatus === InviteStatus.ACCEPTED);
      if (!isValidWinner) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Winner must be a participant." });
      }

      await ctx.prisma.challenge.update({
        where: { id: input.challengeId },
        data: { status: "COMPLETED", winnerId: input.winnerId, completedAt: new Date() },
      });

      if (challenge.wagerAmount > 0) {
        const acceptedCount = challenge.participants.filter((p) => p.inviteStatus === InviteStatus.ACCEPTED).length;
        const pot = challenge.wagerAmount * acceptedCount;
        await ctx.prisma.$transaction([
          ctx.prisma.user.update({
            where: { id: input.winnerId },
            data: { balance: { increment: pot } },
          }),
          ctx.prisma.pointTransaction.create({
            data: {
              userId: input.winnerId,
              amount: pot,
              type: TransactionType.CHALLENGE_WON,
              description: `Won challenge: ${challenge.title}`,
            },
          }),
        ]);
      }

      logger.info("challenge.completed", { challengeId: input.challengeId, winnerId: input.winnerId, wagerAmount: challenge.wagerAmount });
      // Notify all participants
      const otherParticipants = challenge.participants
        .map((p) => p.userId)
        .filter((id) => id !== ctx.session.user.id);
      if (otherParticipants.length > 0) {
        await ctx.prisma.notification.createMany({
          data: otherParticipants.map((userId) => ({
            userId,
            actorId: ctx.session.user.id,
            type: NotificationType.CHALLENGE_COMPLETED,
            entityId: challenge.id,
            entityType: "challenge",
            message: `completed the challenge "${challenge.title}"`,
          })),
        });
      }

      return { ok: true };
    }),

  cancelChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: {
          id: true,
          title: true,
          creatorId: true,
          status: true,
          wagerAmount: true,
          participants: { select: { userId: true } },
        },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      if (challenge.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can cancel this challenge." });
      }
      if (["COMPLETED", "CANCELLED"].includes(challenge.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge is already finished." });
      }

      logger.info("challenge.cancelled", { challengeId: input.challengeId, creatorId: ctx.session.user.id });
      await ctx.prisma.challenge.update({
        where: { id: input.challengeId },
        data: { status: "CANCELLED" },
      });

      // Refund all participants if there was a wager
      if (challenge.wagerAmount > 0) {
        const refundOps = challenge.participants.flatMap((p) => [
          ctx.prisma.user.update({
            where: { id: p.userId },
            data: { balance: { increment: challenge.wagerAmount } },
          }),
          ctx.prisma.pointTransaction.create({
            data: {
              userId: p.userId,
              amount: challenge.wagerAmount,
              type: TransactionType.CHALLENGE_REFUNDED,
              description: `Challenge cancelled refund: ${challenge.title}`,
            },
          }),
        ]);
        await ctx.prisma.$transaction(refundOps);
      }

      return { ok: true };
    }),

  inviteParticipants: protectedProcedure
    .input(z.object({
      challengeId: z.string(),
      userIds: z.array(z.string()).min(1).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: { creatorId: true, title: true, participants: { select: { userId: true } } },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      if (challenge.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can invite participants." });
      }
      const existingIds = new Set(challenge.participants.map((p) => p.userId));
      const newUserIds = input.userIds.filter((id) => !existingIds.has(id));
      if (newUserIds.length === 0) return { added: 0 };
      await ctx.prisma.challengeParticipant.createMany({
        data: newUserIds.map((userId) => ({ challengeId: input.challengeId, userId, inviteStatus: InviteStatus.PENDING })),
      });
      await ctx.prisma.notification.createMany({
        data: newUserIds.map((userId) => ({
          userId,
          actorId: ctx.session.user.id,
          type: NotificationType.CHALLENGE_INVITED,
          entityId: input.challengeId,
          entityType: "challenge",
          message: `invited you to join "${challenge.title}"`,
        })),
      });
      return { added: newUserIds.length };
    }),

  getPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    const invites = await ctx.prisma.challengeParticipant.findMany({
      where: { userId: ctx.session.user.id, inviteStatus: InviteStatus.PENDING },
      include: {
        challenge: {
          include: {
            creator: { select: { id: true, name: true, image: true } },
            _count: { select: { participants: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    return { invites };
  }),

  acceptInvite: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const participant = await ctx.prisma.challengeParticipant.findUnique({
        where: { challengeId_userId: { challengeId: input.challengeId, userId: ctx.session.user.id } },
        include: { challenge: { select: { id: true, title: true, status: true, wagerAmount: true, creatorId: true } } },
      });
      if (!participant) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found." });
      if (participant.inviteStatus !== InviteStatus.PENDING) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has already been responded to." });
      }
      if (["COMPLETED", "CANCELLED"].includes(participant.challenge.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This challenge is no longer active." });
      }
      if (participant.challenge.wagerAmount > 0) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { balance: true },
        });
        if (!user || user.balance < participant.challenge.wagerAmount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance to accept this challenge." });
        }
        await ctx.prisma.$transaction([
          ctx.prisma.challengeParticipant.update({
            where: { challengeId_userId: { challengeId: input.challengeId, userId: ctx.session.user.id } },
            data: { inviteStatus: InviteStatus.ACCEPTED },
          }),
          ctx.prisma.user.update({
            where: { id: ctx.session.user.id },
            data: { balance: { decrement: participant.challenge.wagerAmount } },
          }),
          ctx.prisma.pointTransaction.create({
            data: {
              userId: ctx.session.user.id,
              amount: -participant.challenge.wagerAmount,
              type: TransactionType.CHALLENGE_ENTRY,
              description: `Challenge entry: ${participant.challenge.title}`,
            },
          }),
        ]);
      } else {
        await ctx.prisma.challengeParticipant.update({
          where: { challengeId_userId: { challengeId: input.challengeId, userId: ctx.session.user.id } },
          data: { inviteStatus: InviteStatus.ACCEPTED },
        });
      }
      await ctx.prisma.notification.create({
        data: {
          userId: participant.challenge.creatorId,
          actorId: ctx.session.user.id,
          type: NotificationType.CHALLENGE_INVITE_ACCEPTED,
          entityId: input.challengeId,
          entityType: "challenge",
          message: `accepted your challenge invite for "${participant.challenge.title}"`,
        },
      });
      logger.info("challenge.invite.accepted", { challengeId: input.challengeId, userId: ctx.session.user.id });
      return { ok: true };
    }),

  declineInvite: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const participant = await ctx.prisma.challengeParticipant.findUnique({
        where: { challengeId_userId: { challengeId: input.challengeId, userId: ctx.session.user.id } },
        include: { challenge: { select: { id: true, title: true, creatorId: true } } },
      });
      if (!participant) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found." });
      if (participant.inviteStatus !== InviteStatus.PENDING) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has already been responded to." });
      }
      await ctx.prisma.challengeParticipant.update({
        where: { challengeId_userId: { challengeId: input.challengeId, userId: ctx.session.user.id } },
        data: { inviteStatus: InviteStatus.DECLINED },
      });
      await ctx.prisma.notification.create({
        data: {
          userId: participant.challenge.creatorId,
          actorId: ctx.session.user.id,
          type: NotificationType.CHALLENGE_INVITE_DECLINED,
          entityId: input.challengeId,
          entityType: "challenge",
          message: `declined your challenge invite for "${participant.challenge.title}"`,
        },
      });
      logger.info("challenge.invite.declined", { challengeId: input.challengeId, userId: ctx.session.user.id });
      return { ok: true };
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

  getComments: publicProcedure
    .input(z.object({ challengeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.challengeComment.findMany({
        where: { challengeId: input.challengeId, parentId: null },
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return { comments };
    }),

  addComment: protectedProcedure
    .input(z.object({
      challengeId: z.string(),
      content: z.string().trim().min(1).max(2000),
      parentId: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: input.challengeId },
        select: { id: true, visibility: true },
      });
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND" });
      if (challenge.visibility === "PRIVATE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot comment on a private challenge." });
      }
      const comment = await ctx.prisma.challengeComment.create({
        data: {
          challengeId: input.challengeId,
          userId: ctx.session.user.id,
          content: input.content,
          parentId: input.parentId ?? null,
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
      });
      return { comment };
    }),

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.challengeComment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await ctx.prisma.challengeComment.delete({ where: { id: input.commentId } });
      return { ok: true };
    }),
});
