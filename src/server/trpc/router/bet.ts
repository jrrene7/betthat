import { BetStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

function parseOptionalDate(value: string | null | undefined) {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid date value.",
    });
  }

  return date;
}

const betInclude = {
  creator: true,
  opponent: true,
  winner: true,
  challenge: true,
} as const;

export const betRouter = router({
  createBet: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(150),
        description: z.string().trim().max(5000).optional().nullable(),
        opponentId: z.string().min(1),
        dueAt: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.opponentId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot create a bet with yourself.",
        });
      }

      const opponent = await ctx.prisma.user.findUnique({
        where: { id: input.opponentId },
        select: { id: true },
      });

      if (!opponent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected opponent was not found.",
        });
      }

      const bet = await ctx.prisma.bet.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          creatorId: ctx.session.user.id,
          opponentId: input.opponentId,
          dueAt: parseOptionalDate(input.dueAt),
        },
        include: betInclude,
      });

      return { bet };
    }),

  getUserBets: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isOwnProfile = ctx.session?.user?.id === input.userId;
      const bets = await ctx.prisma.bet.findMany({
        where: {
          OR: [{ creatorId: input.userId }, { opponentId: input.userId }],
          // Only show pending bets on the owner's own profile
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
      where: {
        opponentId: ctx.session.user.id,
        status: BetStatus.PENDING,
      },
      include: betInclude,
      orderBy: { createdAt: "desc" },
    });
    return { bets };
  }),

  getInboxCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.bet.count({
      where: {
        opponentId: ctx.session.user.id,
        status: BetStatus.PENDING,
      },
    });
    return { count };
  }),

  getMyBets: protectedProcedure.query(async ({ ctx }) => {
    const bets = await ctx.prisma.bet.findMany({
      where: {
        OR: [
          { creatorId: ctx.session.user.id },
          { opponentId: ctx.session.user.id },
        ],
      },
      include: betInclude,
      orderBy: { createdAt: "desc" },
    });
    return { bets };
  }),

  getBet: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.id },
        include: betInclude,
      });

      if (!bet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
      }

      const userId = ctx.session.user.id;
      if (bet.creatorId !== userId && bet.opponentId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }

      return { bet };
    }),

  acceptBet: protectedProcedure
    .input(z.object({ betId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { id: true, opponentId: true, status: true },
      });

      if (!bet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
      }

      if (bet.opponentId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the opponent can accept a bet.",
        });
      }

      if (bet.status !== BetStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending bets can be accepted.",
        });
      }

      const updated = await ctx.prisma.bet.update({
        where: { id: input.betId },
        data: { status: BetStatus.ACTIVE },
        include: betInclude,
      });

      return { bet: updated };
    }),

  declineBet: protectedProcedure
    .input(z.object({ betId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findUnique({
        where: { id: input.betId },
        select: { id: true, opponentId: true, status: true },
      });

      if (!bet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
      }

      if (bet.opponentId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the opponent can decline a bet.",
        });
      }

      if (bet.status !== BetStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending bets can be declined.",
        });
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
        select: {
          id: true,
          creatorId: true,
          opponentId: true,
          status: true,
        },
      });

      if (!bet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bet not found." });
      }

      const userId = ctx.session.user.id;
      if (bet.creatorId !== userId && bet.opponentId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }

      if (bet.status !== BetStatus.ACTIVE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only active bets can be settled.",
        });
      }

      if (
        input.winnerId !== bet.creatorId &&
        input.winnerId !== bet.opponentId
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Winner must be one of the bet participants.",
        });
      }

      const updated = await ctx.prisma.bet.update({
        where: { id: input.betId },
        data: {
          status: BetStatus.SETTLED,
          winnerId: input.winnerId,
          resolvedAt: new Date(),
        },
        include: betInclude,
      });

      return { bet: updated };
    }),
});
