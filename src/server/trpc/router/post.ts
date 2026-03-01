import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

export const postRouter = router({
  createPost: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().max(150).optional().nullable(),
        content: z.string().trim().max(5000).optional().nullable(),
        videoId: z.string().optional().nullable(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const title = input.title?.trim();
      const videoId = input.videoId ?? undefined;
      const content = input.content?.trim() ?? "";

      if (!content && !videoId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post must include text or a video.",
        });
      }

      if (videoId) {
        const ownedVideo = await ctx.prisma.video.findFirst({
          where: {
            id: videoId,
            userId: ctx.session.user.id,
          },
          select: {
            id: true,
          },
        });

        if (!ownedVideo) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid video selected for post.",
          });
        }
      }

      const post = await ctx.prisma.post.create({
        data: {
          title,
          content,
          isPublished: input.isPublished ?? true,
          authorId: ctx.session.user.id,
          videoId,
        },
        include: {
          author: true,
          video: true,
        },
      });

      return { post };
    }),
});
