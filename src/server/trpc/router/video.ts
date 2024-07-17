import { Follow, Likes } from "@prisma/client";
import {
  protectedProcedure,
  publicProcedure,
  router,
} from "src/server/trpc/trpc";
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
  getVideo: publicProcedure
    .input(
      z.object({ cursor: z.number().nullish(), limit: z.number().nullable() })
    )
    .query(async ({ ctx, input }) => {
      const skip = input?.cursor || 0;
      const videos = await ctx.prisma.video.findMany({
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              comment: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input?.limit || 5,
        skip,
      });
      let likes: Likes[] = [];
      let follows: Follow[] = [];
      if (ctx.session?.user) {
        const [likedByMe, followedByMe] = await Promise.all([
          ctx.prisma.likes.findMany({
            where: {
              userId: ctx.session.user.id,
              videoId: { in: videos.map((item) => item.id) },
            },
          }),
          ctx.prisma.follow.findMany({
            where: {
              followerId: ctx.session.user.id,
              followingId: { in: videos.map((item) => item.user?.id!) },
            },
          }),
        ]);
        likes = likedByMe;
        follows = followedByMe;
      }
      return {
        videos: videos.map((item) => ({
          ...item,
          isLike: likes.some((like) => like.videoId === item.id),
          isFollow: follows.some(
            (follow) => follow.followingId === item.user?.id
          ),
        })),
        hasNextPage: videos.length < (input.limit || 5) ? true : false,
        nextSkip:
          videos.length < (input.limit || 5) ? null : skip + input?.limit!,
      };
    }),
  getFollowingVideos: protectedProcedure
    .input(
      z.object({ cursor: z.number().nullish(), limit: z.number().nullable() })
    )
    .query(async ({ ctx, input }) => {
      const skip = input?.cursor || 0;
      const followings = await ctx.prisma.follow.findMany({
        where: {
          followerId: ctx.session.user.id,
        },
      })
      const videos = await ctx.prisma.video.findMany({
        where: {
            userId: { in: followings.map((item) => item.followingId) },
          },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              comment: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input?.limit || 5,
        skip,
      });
      let likes: Likes[] = [];
      let follows: Follow[] = [];
      if (ctx.session?.user) {
        const [likedByMe, followedByMe] = await Promise.all([
          ctx.prisma.likes.findMany({
            where: {
              userId: ctx.session.user.id,
              videoId: { in: videos.map((item) => item.id) },
            },
          }),
          ctx.prisma.follow.findMany({
            where: {
              followerId: ctx.session.user.id,
              followingId: { in: videos.map((item) => item.user?.id!) },
            },
          }),
        ]);
        likes = likedByMe;
        follows = followedByMe;
      }
      return {
        videos: videos.map((item) => ({
          ...item,
          isLike: likes.some((like) => like.videoId === item.id),
          isFollow: follows.some(
            (follow) => follow.followingId === item.user?.id
          ),
        })),
        hasNextPage: videos.length < (input.limit || 5) ? true : false,
        nextSkip:
          videos.length < (input.limit || 5) ? null : skip + input?.limit!,
      };
    }),
});
