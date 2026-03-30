import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

const postInclude = {
  author: true,
  video: true,
  _count: { select: { likes: true, comments: true } },
} as const;

export const postRouter = router({
  createPost: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().max(150).optional().nullable(),
        content: z.string().trim().max(5000).optional().nullable(),
        imageUrl: z.string().url().optional().nullable(),
        isPublished: z.boolean().optional(),
        // Video is created server-side as part of the post — never passed as a pre-existing videoId
        video: z.object({
          url: z.string().url(),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        }).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const title = input.title?.trim() || null;
      const content = input.content?.trim() ?? "";
      const imageUrl = input.imageUrl ?? null;

      if (!content && !input.video && !imageUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post must include text, an image, or a video.",
        });
      }

      // Create the Video record inline — it only ever exists as part of a post
      let videoId: string | undefined;
      if (input.video) {
        const video = await ctx.prisma.video.create({
          data: {
            title: title ?? "Post video",
            videoUrl: input.video.url,
            width: input.video.width,
            height: input.video.height,
            userId: ctx.session.user.id,
          },
        });
        videoId = video.id;
      }

      const post = await ctx.prisma.post.create({
        data: {
          title,
          content,
          isPublished: input.isPublished ?? true,
          authorId: ctx.session.user.id,
          videoId,
          imageUrl,
        },
        include: postInclude,
      });

      return { post };
    }),

  getPosts: publicProcedure
    .input(
      z.object({
        skip: z.number().default(0),
        limit: z.number().default(10),
        authorId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        where: {
          isPublished: true,
          ...(input.authorId ? { authorId: input.authorId } : {}),
        },
        include: postInclude,
        orderBy: { createdAt: "desc" },
        skip: input.skip,
        take: input.limit,
      });

      let likedPostIds = new Set<string>();
      if (ctx.session?.user && posts.length > 0) {
        const likes = await ctx.prisma.postLike.findMany({
          where: {
            userId: ctx.session.user.id,
            postId: { in: posts.map((p) => p.id) },
          },
          select: { postId: true },
        });
        likedPostIds = new Set(likes.map((l) => l.postId));
      }

      return {
        posts: posts.map((p) => ({ ...p, isLike: likedPostIds.has(p.id) })),
      };
    }),

  likePost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.postLike.findUnique({
        where: {
          postId_userId: { postId: input.postId, userId: ctx.session.user.id },
        },
      });

      if (existing) {
        await ctx.prisma.postLike.delete({ where: { id: existing.id } });
        return { liked: false };
      }

      await ctx.prisma.postLike.create({
        data: { postId: input.postId, userId: ctx.session.user.id },
      });
      return { liked: true };
    }),

  commentOnPost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().trim().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.postComment.create({
        data: {
          postId: input.postId,
          userId: ctx.session.user.id,
          content: input.content.trim(),
        },
        include: { user: true },
      });
      return { comment };
    }),

  getLikedPosts: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Only allow users to view their own liked posts
      if (ctx.session.user.id !== input.userId) {
        return { posts: [] };
      }

      const likes = await ctx.prisma.postLike.findMany({
        where: { userId: input.userId },
        include: {
          post: { include: postInclude },
        },
        orderBy: { post: { createdAt: "desc" } },
      });
      return { posts: likes.map((l) => l.post) };
    }),

  getPostComments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.postComment.findMany({
        where: { postId: input.postId },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      });
      return { comments };
    }),
});
