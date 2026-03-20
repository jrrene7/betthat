import { protectedProcedure, router } from "src/server/trpc/trpc";

export const userRouter = router({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { id: true, name: true, image: true, balance: true },
    });
    return { user };
  }),
});
