import { protectedProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

export const videoRouter = router({
  createVideo: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        videoWidth: z.number(),
        videoHeight: z.number(),
        videoUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.create({
        data: {
          title: input.title,
          width: input.videoWidth,
          height: input.videoHeight,
          videoUrl: input.videoUrl,
          userId: ctx.session.user.id,
        },
      });
      return { video };
    }),
});
