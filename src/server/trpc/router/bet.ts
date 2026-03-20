import { BetStatus, TransactionType, Visibility } from "@prisma/client";
import { TRPCError } from "@trpc/server";
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

const betInclude = {
  creator: true,
  opponent: true,
  winner: true,
  challenge: true,
  votes: true,
  _count: { select: { votes: true } },
} as const;

export const betRouter = router({
  createBet: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(150),
        description: z.string().trim().max(5000).optional().nullable(),
        opponentId: z.string().min(1),
        dueAt: z.string().optional().nullable(),
        wagerAmount: z.number().int().min(0).max(100000).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.opponentId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot create a bet with yourself." });
      }
      const opponent = await ctx.prisma.user.findUnique({
        where: { id: input.opponentId },
        select: { id: true },
      });
      if (!opponent) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Selected opponent was not found." });
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
      const bet = await ctx.prisma.bet.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          creatorId: ctx.session.user.id,
          opponentId: input.opponentId,
          dueAt: parseOptionalDate(input.dueAt),
          wagerAmount: input.wagerAmount,
        },
        include: betInclude,
      });
      return { bet };
    }),

  getPublicBets: publicProcedure
    .input(z.object({ skip: z.number().default(0), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const bets = await ctx.prisma.bet.findMany({
        where: { NOT: { visibility: { in: [Visibility.UNLISTED, Visibility.PRIVATE] } } },
        include: betInclude,
        orderBy: { createdAt: "desc" },
        skip: input.skip,
        take: input.limit,
      });
      return { bets };
    }),

  getUserBets: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isOwnProfile = ctx.session?.user?.id === input.userId;
      const bets = await ctx.prisma.bet.findMany({
        where: {
          OR: [{ creatorId: input.userId }, { opponentId: input.userId }],
          ...(!isOwnProfile ? { status: { in: [BetStatus.ACTIVE, BetStatus.SETTLED] } } : {}),
        },
        include: betInclude,
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return { bets };
    }),

  getInbox: protectedProcedure.query(async ({ ctx }) => {
    const bets = await ctx.prisma.bet.findMany({
      where: { opponentId: ctx.session.user.id, status: BetStatus.PENDING },
      include: betInclude,
      orderBy: { createdAt: "desc" },
    });
    return { bets };
  }),

  getInboxCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.bet.count({
      where: { opponentId: ctx.session.user.id, status: BetStatus.PENDING },
    });
    return { count };
  }),

  getMyBets: protectedProcedure.query(async ({ ctx }) => {
    const bets = await ctx.prisma.bet.findMany({
      where: {
        OR: [{ creatorId: ctx.session.user.id }, { opponentId: ctx.session.user.id }],
      },
      include: betInclude,
      orderBy: { createdAt: "desc" },
    });
    return { bets };
  }),

  getBet: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.id },
        include: betInclude,
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });

      const userId = ctx.session?.user?.id;
      const isParticipant = userId && (bet.creatorId === userId || bet.opponentId === userId);
      if (bet.visibility !== Visibility.PUBLIC && !isParticipant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This bet is private." });
      }
      return { bet };
    }),

  updateVisibility: protectedProcedure
    .input(z.object({
      betId: z.string(),
      visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { creatorId: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND" });
      if (bet.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can change visibility." });
      }
      const updated = await ctx.prisma.bet.update({
        where: { id: input.betId },
        data: { visibility: input.visibility as Visibility },
        include: betInclude,
      });
      return { bet: updated };
    }),

  acceptBet: protectedProcedure
    .input(z.object({ betId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { id: true, opponentId: true, creatorId: true, status: true, wagerAmount: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
      if (bet.opponentId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the opponent can accept a bet." });
      }
      if (bet.status !== BetStatus.PENDING) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending bets can be accepted." });
      }

      // Deduct wager from both participants if wagerAmount > 0
      if (bet.wagerAmount > 0) {
        const [creator, opponent] = await Promise.all([
          ctx.prisma.user.findUnique({ where: { id: bet.creatorId }, select: { balance: true } }),
          ctx.prisma.user.findUnique({ where: { id: bet.opponentId }, select: { balance: true } }),
        ]);
        if (!creator || creator.balance < bet.wagerAmount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Creator no longer has sufficient balance." });
        }
        if (!opponent || opponent.balance < bet.wagerAmount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You don't have sufficient balance for this wager." });
        }
        await ctx.prisma.$transaction([
          ctx.prisma.user.update({ where: { id: bet.creatorId }, data: { balance: { decrement: bet.wagerAmount } } }),
          ctx.prisma.user.update({ where: { id: bet.opponentId }, data: { balance: { decrement: bet.wagerAmount } } }),
          ctx.prisma.pointTransaction.create({
            data: { userId: bet.creatorId, amount: -bet.wagerAmount, type: TransactionType.BET_PLACED, betId: bet.id, description: `Wager placed` },
          }),
          ctx.prisma.pointTransaction.create({
            data: { userId: bet.opponentId, amount: -bet.wagerAmount, type: TransactionType.BET_PLACED, betId: bet.id, description: `Wager placed` },
          }),
          ctx.prisma.bet.update({ where: { id: input.betId }, data: { status: BetStatus.ACTIVE } }),
        ]);
      } else {
        await ctx.prisma.bet.update({
          where: { id: input.betId },
          data: { status: BetStatus.ACTIVE },
        });
      }

      const updated = await ctx.prisma.bet.findUnique({ where: { id: input.betId }, include: betInclude });
      return { bet: updated };
    }),

  declineBet: protectedProcedure
    .input(z.object({ betId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { id: true, opponentId: true, status: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
      if (bet.opponentId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the opponent can decline a bet." });
      }
      if (bet.status !== BetStatus.PENDING) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending bets can be declined." });
      }
      const updated = await ctx.prisma.bet.update({
        where: { id: input.betId },
        data: { status: BetStatus.DECLINED },
        include: betInclude,
      });
      return { bet: updated };
    }),

  settleBet: protectedProcedure
    .input(z.object({ betId: z.string(), winnerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { id: true, creatorId: true, opponentId: true, status: true, wagerAmount: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
      const userId = ctx.session.user.id;
      if (bet.creatorId !== userId && bet.opponentId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }
      if (bet.status !== BetStatus.ACTIVE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only active bets can be settled." });
      }
      if (input.winnerId !== bet.creatorId && input.winnerId !== bet.opponentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Winner must be one of the bet participants." });
      }

      const loserId = input.winnerId === bet.creatorId ? bet.opponentId : bet.creatorId;

      if (bet.wagerAmount > 0) {
        const payout = bet.wagerAmount * 2;
        await ctx.prisma.$transaction([
          ctx.prisma.user.update({ where: { id: input.winnerId }, data: { balance: { increment: payout } } }),
          ctx.prisma.pointTransaction.create({
            data: { userId: input.winnerId, amount: payout, type: TransactionType.BET_WON, betId: bet.id, description: `Bet won` },
          }),
          ctx.prisma.pointTransaction.create({
            data: { userId: loserId, amount: 0, type: TransactionType.BET_LOST, betId: bet.id, description: `Bet lost` },
          }),
          ctx.prisma.bet.update({
            where: { id: input.betId },
            data: { status: BetStatus.SETTLED, winnerId: input.winnerId, resolvedAt: new Date() },
          }),
        ]);
      } else {
        await ctx.prisma.bet.update({
          where: { id: input.betId },
          data: { status: BetStatus.SETTLED, winnerId: input.winnerId, resolvedAt: new Date() },
        });
      }

      const updated = await ctx.prisma.bet.findUnique({ where: { id: input.betId }, include: betInclude });
      return { bet: updated };
    }),

  submitToBet: protectedProcedure
    .input(z.object({
      betId: z.string(),
      content: z.string().trim().max(2000).optional().nullable(),
      mediaUrl: z.string().url().optional().nullable(),
    }).refine((d) => !!(d.content || d.mediaUrl), {
      message: "Submission must have content or media.",
    }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { creatorId: true, opponentId: true, status: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND" });
      const isParticipant = bet.creatorId === ctx.session.user.id || bet.opponentId === ctx.session.user.id;
      if (!isParticipant) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only bet participants can submit evidence." });
      }
      if (bet.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence can only be submitted to active bets." });
      }
      const submission = await ctx.prisma.betSubmission.create({
        data: {
          betId: input.betId,
          userId: ctx.session.user.id,
          content: input.content?.trim() || null,
          imageUrl: input.mediaUrl || null,
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });
      return { submission };
    }),

  getBetSubmissions: publicProcedure
    .input(z.object({ betId: z.string() }))
    .query(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { visibility: true, creatorId: true, opponentId: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND" });
      const userId = ctx.session?.user?.id;
      const isParticipant = userId && (bet.creatorId === userId || bet.opponentId === userId);
      if (bet.visibility === Visibility.PRIVATE && !isParticipant) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const submissions = await ctx.prisma.betSubmission.findMany({
        where: { betId: input.betId },
        include: {
          user: { select: { id: true, name: true, image: true } },
          video: true,
        },
        orderBy: { createdAt: "asc" },
      });
      return { submissions };
    }),

  castBetVote: protectedProcedure
    .input(z.object({ betId: z.string(), votedForId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { creatorId: true, opponentId: true, status: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["ACTIVE", "SETTLED"].includes(bet.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only vote on active or settled bets." });
      }
      if (input.votedForId !== bet.creatorId && input.votedForId !== bet.opponentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Must vote for one of the participants." });
      }
      await ctx.prisma.betVote.upsert({
        where: { betId_voterId: { betId: input.betId, voterId: ctx.session.user.id } },
        create: { betId: input.betId, voterId: ctx.session.user.id, votedForId: input.votedForId },
        update: { votedForId: input.votedForId },
      });
      return { ok: true };
    }),
});
