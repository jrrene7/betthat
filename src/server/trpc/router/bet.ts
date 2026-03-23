import { BetStatus, NotificationType, PrismaClient, TransactionType, Visibility } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

type PrismaCtx = { prisma: PrismaClient; session: { user: { id: string } } };

async function doSettle(
  prisma: PrismaClient,
  betId: string,
  winnerId: string,
  creatorId: string,
  opponentId: string,
  wagerAmount: number,
) {
  const loserId = winnerId === creatorId ? opponentId : creatorId;
  if (wagerAmount > 0) {
    const payout = wagerAmount * 2;
    await prisma.$transaction([
      prisma.user.update({ where: { id: winnerId }, data: { balance: { increment: payout } } }),
      prisma.pointTransaction.create({ data: { userId: winnerId, amount: payout, type: TransactionType.BET_WON, betId, description: "Bet won" } }),
      prisma.pointTransaction.create({ data: { userId: loserId, amount: 0, type: TransactionType.BET_LOST, betId, description: "Bet lost" } }),
      prisma.bet.update({ where: { id: betId }, data: { status: BetStatus.SETTLED, winnerId, resolvedAt: new Date() } }),
    ]);
  } else {
    await prisma.bet.update({ where: { id: betId }, data: { status: BetStatus.SETTLED, winnerId, resolvedAt: new Date() } });
  }
}

async function castSettleVoteImpl(ctx: PrismaCtx, betId: string, winnerId: string) {
  const bet = await ctx.prisma.bet.findUnique({
    where: { id: betId },
    select: { id: true, creatorId: true, opponentId: true, status: true, wagerAmount: true, creatorSettleVote: true, opponentSettleVote: true },
  });
  if (!bet) throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
  const userId = ctx.session.user.id;
  const isCreator = userId === bet.creatorId;
  const isOpponent = userId === bet.opponentId;
  if (!isCreator && !isOpponent) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  if (bet.status !== BetStatus.ACTIVE && bet.status !== BetStatus.DISPUTED) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Only active or disputed bets can be settled." });
  }
  if (winnerId !== bet.creatorId && winnerId !== bet.opponentId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Winner must be one of the bet participants." });
  }

  const updateData = isCreator
    ? { creatorSettleVote: winnerId }
    : { opponentSettleVote: winnerId };

  const updated = await ctx.prisma.bet.update({
    where: { id: betId },
    data: updateData,
    select: { id: true, creatorId: true, opponentId: true, status: true, wagerAmount: true, creatorSettleVote: true, opponentSettleVote: true },
  });

  const creatorVote = updated.creatorSettleVote;
  const opponentVote = updated.opponentSettleVote;

  // Both voted and agree → settle
  if (creatorVote && opponentVote && creatorVote === opponentVote) {
    await doSettle(ctx.prisma, betId, creatorVote, bet.creatorId, bet.opponentId, bet.wagerAmount);
    // Notify both
    await ctx.prisma.notification.createMany({
      data: [
        { userId: bet.creatorId, actorId: null, type: NotificationType.BET_SETTLED, entityId: betId, entityType: "bet", message: `Your bet was settled` },
        { userId: bet.opponentId, actorId: null, type: NotificationType.BET_SETTLED, entityId: betId, entityType: "bet", message: `Your bet was settled` },
      ],
    });
    const final = await ctx.prisma.bet.findUnique({ where: { id: betId }, include: betInclude });
    return { bet: final, state: "settled" as const };
  }

  // Both voted but disagree → DISPUTED
  if (creatorVote && opponentVote && creatorVote !== opponentVote) {
    await ctx.prisma.bet.update({ where: { id: betId }, data: { status: BetStatus.DISPUTED } });
    await ctx.prisma.notification.createMany({
      data: [
        { userId: bet.creatorId, actorId: bet.opponentId, type: NotificationType.BET_DISPUTED, entityId: betId, entityType: "bet", message: "disagreed on the result — community votes will decide" },
        { userId: bet.opponentId, actorId: bet.creatorId, type: NotificationType.BET_DISPUTED, entityId: betId, entityType: "bet", message: "disagreed on the result — community votes will decide" },
      ],
    });
    const final = await ctx.prisma.bet.findUnique({ where: { id: betId }, include: betInclude });
    return { bet: final, state: "disputed" as const };
  }

  // Only one has voted so far
  const otherPartyId = isCreator ? bet.opponentId : bet.creatorId;
  await ctx.prisma.notification.create({
    data: { userId: otherPartyId, actorId: userId, type: NotificationType.BET_SETTLED, entityId: betId, entityType: "bet", message: "voted on the result — waiting for your vote" },
  });
  const final = await ctx.prisma.bet.findUnique({ where: { id: betId }, include: betInclude });
  return { bet: final, state: "waiting" as const };
}

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
      // Notify opponent
      await ctx.prisma.notification.create({
        data: {
          userId: input.opponentId,
          actorId: ctx.session.user.id,
          type: NotificationType.BET_RECEIVED,
          entityId: bet.id,
          entityType: "bet",
          message: `challenged you to a bet: "${bet.title}"`,
        },
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
    const [betCount, notifCount] = await Promise.all([
      ctx.prisma.bet.count({
        where: { opponentId: ctx.session.user.id, status: BetStatus.PENDING },
      }),
      ctx.prisma.notification.count({
        where: { userId: ctx.session.user.id, read: false },
      }),
    ]);
    return { count: betCount + notifCount, betCount, notifCount };
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

  updateBet: protectedProcedure
    .input(z.object({
      betId: z.string(),
      title: z.string().trim().min(1).max(150),
      description: z.string().trim().max(5000).optional().nullable(),
      dueAt: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { creatorId: true, status: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND" });
      if (bet.creatorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can edit this bet." });
      }
      if (["SETTLED", "DECLINED", "CANCELLED"].includes(bet.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot edit a completed bet." });
      }
      const updated = await ctx.prisma.bet.update({
        where: { id: input.betId },
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          dueAt: parseOptionalDate(input.dueAt),
        },
        include: betInclude,
      });
      return { bet: updated };
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
      // Notify creator that bet was accepted
      await ctx.prisma.notification.create({
        data: {
          userId: bet.creatorId,
          actorId: ctx.session.user.id,
          type: NotificationType.BET_ACCEPTED,
          entityId: bet.id,
          entityType: "bet",
          message: `accepted your bet`,
        },
      });
      return { bet: updated };
    }),

  declineBet: protectedProcedure
    .input(z.object({ betId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { id: true, opponentId: true, creatorId: true, status: true },
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
      // Notify creator that bet was declined
      await ctx.prisma.notification.create({
        data: {
          userId: bet.creatorId,
          actorId: ctx.session.user.id,
          type: NotificationType.BET_DECLINED,
          entityId: bet.id,
          entityType: "bet",
          message: `declined your bet`,
        },
      });
      return { bet: updated };
    }),

  // Keep old name as alias so existing calls don't break
  settleBet: protectedProcedure
    .input(z.object({ betId: z.string(), winnerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Delegates to castSettleVote logic
      return castSettleVoteImpl(ctx, input.betId, input.winnerId);
    }),

  castSettleVote: protectedProcedure
    .input(z.object({ betId: z.string(), winnerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return castSettleVoteImpl(ctx, input.betId, input.winnerId);
    }),

  resolveDispute: protectedProcedure
    .input(z.object({ betId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { id: true, creatorId: true, opponentId: true, status: true, wagerAmount: true, votes: true },
      });
      if (!bet) throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
      if (bet.creatorId !== ctx.session.user.id && bet.opponentId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }
      if (bet.status !== BetStatus.DISPUTED) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only disputed bets can be resolved this way." });
      }
      const creatorVotes = bet.votes.filter((v) => v.votedForId === bet.creatorId).length;
      const opponentVotes = bet.votes.filter((v) => v.votedForId === bet.opponentId).length;
      // Tied → refund both
      if (creatorVotes === opponentVotes) {
        if (bet.wagerAmount > 0) {
          await ctx.prisma.$transaction([
            ctx.prisma.user.update({ where: { id: bet.creatorId }, data: { balance: { increment: bet.wagerAmount } } }),
            ctx.prisma.user.update({ where: { id: bet.opponentId }, data: { balance: { increment: bet.wagerAmount } } }),
            ctx.prisma.pointTransaction.create({ data: { userId: bet.creatorId, amount: bet.wagerAmount, type: TransactionType.BET_REFUNDED, betId: bet.id, description: "Bet tied — refunded" } }),
            ctx.prisma.pointTransaction.create({ data: { userId: bet.opponentId, amount: bet.wagerAmount, type: TransactionType.BET_REFUNDED, betId: bet.id, description: "Bet tied — refunded" } }),
            ctx.prisma.bet.update({ where: { id: input.betId }, data: { status: BetStatus.SETTLED, resolvedAt: new Date() } }),
          ]);
        } else {
          await ctx.prisma.bet.update({ where: { id: input.betId }, data: { status: BetStatus.SETTLED, resolvedAt: new Date() } });
        }
        const updated = await ctx.prisma.bet.findUnique({ where: { id: input.betId }, include: betInclude });
        return { bet: updated, outcome: "tied" as const };
      }
      const winnerId = creatorVotes > opponentVotes ? bet.creatorId : bet.opponentId;
      await doSettle(ctx.prisma, bet.id, winnerId, bet.creatorId, bet.opponentId, bet.wagerAmount);
      const updated = await ctx.prisma.bet.findUnique({ where: { id: input.betId }, include: betInclude });
      // Notify both parties
      const otherPartyId = ctx.session.user.id === bet.creatorId ? bet.opponentId : bet.creatorId;
      await ctx.prisma.notification.create({
        data: { userId: otherPartyId, actorId: null, type: NotificationType.BET_SETTLED, entityId: bet.id, entityType: "bet", message: `Your disputed bet was resolved by community vote` },
      });
      return { bet: updated, outcome: "settled" as const };
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
