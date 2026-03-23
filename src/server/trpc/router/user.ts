import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "src/server/trpc/trpc";

export const userRouter = router({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { id: true, name: true, image: true, balance: true },
    });
    return { user };
  }),

  getProfileStats: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [betsWon, betsTotal, challengesWon, challengesTotal] = await Promise.all([
        ctx.prisma.bet.count({ where: { winnerId: input.userId } }),
        ctx.prisma.bet.count({
          where: {
            OR: [{ creatorId: input.userId }, { opponentId: input.userId }],
            status: "SETTLED",
          },
        }),
        ctx.prisma.challenge.count({ where: { winnerId: input.userId } }),
        ctx.prisma.challengeParticipant.count({ where: { userId: input.userId } }),
      ]);
      return { betsWon, betsTotal, challengesWon, challengesTotal };
    }),

  getLeaderboard: publicProcedure
    .input(z.object({ by: z.enum(["wins", "balance"]).default("wins"), limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      if (input.by === "balance") {
        const users = await ctx.prisma.user.findMany({
          orderBy: { balance: "desc" },
          take: input.limit,
          select: { id: true, name: true, image: true, balance: true },
        });
        return { users: users.map((u, i) => ({ ...u, rank: i + 1, wins: null as number | null })) };
      }

      // Wins leaderboard — aggregate bet + challenge wins
      const [betWins, challengeWins, allUsers] = await Promise.all([
        ctx.prisma.bet.groupBy({ by: ["winnerId"], _count: { id: true }, where: { winnerId: { not: null } } }),
        ctx.prisma.challenge.groupBy({ by: ["winnerId"], _count: { id: true }, where: { winnerId: { not: null } } }),
        ctx.prisma.user.findMany({ select: { id: true, name: true, image: true, balance: true } }),
      ]);

      const winMap = new Map<string, number>();
      for (const row of betWins) {
        if (row.winnerId) winMap.set(row.winnerId, (winMap.get(row.winnerId) ?? 0) + row._count.id);
      }
      for (const row of challengeWins) {
        if (row.winnerId) winMap.set(row.winnerId, (winMap.get(row.winnerId) ?? 0) + row._count.id);
      }

      const ranked = allUsers
        .map((u) => ({ ...u, wins: winMap.get(u.id) ?? 0 }))
        .filter((u) => u.wins > 0)
        .sort((a, b) => b.wins - a.wins || b.balance - a.balance)
        .slice(0, input.limit)
        .map((u, i) => ({ ...u, rank: i + 1 }));

      return { users: ranked };
    }),
});
