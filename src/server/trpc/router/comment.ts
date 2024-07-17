import { protectedProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

export const commentRouter = router({
  createComment: protectedProcedure
    .input(
      z.object({
        videoId: z.string().nullable(),
        comment: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          videoId: input?.videoId!,
          comment: input?.comment!,
          userId: ctx.session.user.id,
        },
      });
      return { comment };
    }),
});
