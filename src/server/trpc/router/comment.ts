import { protectedProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

export const commentRouter = router({
  createComment: protectedProcedure
    .input(
      z.object({
        videoId: z.string().min(1),
        comment: z.string().trim().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          videoId: input.videoId,
          comment: input.comment,
          userId: ctx.session.user.id,
        },
        include: {
          user: true,
        },
      });
      return { comment };
    }),
});
