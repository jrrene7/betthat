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
});
