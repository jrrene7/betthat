import { publicProcedure, protectedProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

async function buildFeedItems(
  ctx: any,
  input: { skip: number; limit: number },
  userIdFilter?: string[]
) {
  const { skip, limit } = input;
  const fetchCount = skip + limit;

  const videoWhere = userIdFilter ? { userId: { in: userIdFilter } } : {};
  const postWhere = userIdFilter
    ? { isPublished: true, authorId: { in: userIdFilter } }
    : { isPublished: true };

  const [videos, posts] = await Promise.all([
    ctx.prisma.video.findMany({
      where: videoWhere,
      include: { user: true, _count: { select: { likes: true, comment: true } } },
      orderBy: { createdAt: "desc" },
      take: fetchCount,
    }),
    ctx.prisma.post.findMany({
      where: postWhere,
      include: {
        author: true,
        video: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: fetchCount,
    }),
  ]);

  // Fetch like state for both videos and posts when user is logged in
  let likedVideoIds = new Set<string>();
  let likedPostIds = new Set<string>();
  if (ctx.session?.user) {
    const [videoLikes, postLikes] = await Promise.all([
      videos.length > 0
        ? ctx.prisma.likes.findMany({
            where: { userId: ctx.session.user.id, videoId: { in: videos.map((v: any) => v.id) } },
            select: { videoId: true },
          })
        : [],
      posts.length > 0
        ? ctx.prisma.postLike.findMany({
            where: { userId: ctx.session.user.id, postId: { in: posts.map((p: any) => p.id) } },
            select: { postId: true },
          })
        : [],
    ]);
    likedVideoIds = new Set((videoLikes as any[]).map((l) => l.videoId));
    likedPostIds = new Set((postLikes as any[]).map((l) => l.postId));
  }

  const videoItems = videos.map((v: any) => ({
    type: "video" as const,
    id: v.id,
    createdAt: v.createdAt,
    data: { ...v, isLike: likedVideoIds.has(v.id) },
  }));

  const postItems = posts.map((p: any) => ({
    type: "post" as const,
    id: p.id,
    createdAt: p.createdAt,
    data: { ...p, isLike: likedPostIds.has(p.id) },
  }));

  const merged = [...videoItems, ...postItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const page = merged.slice(skip, skip + limit);
  const hasMore = merged.length > skip + limit;
  return { items: page, hasMore, nextSkip: hasMore ? skip + limit : null };
}

export const feedRouter = router({
  getFeed: publicProcedure
    .input(z.object({ skip: z.number().default(0), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => buildFeedItems(ctx, input)),

  getFollowingFeed: protectedProcedure
    .input(z.object({ skip: z.number().default(0), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const follows = await ctx.prisma.follow.findMany({
        where: { followerId: ctx.session.user.id },
        select: { followingId: true },
      });
      const followingIds = follows.map((f: any) => f.followingId);
      if (followingIds.length === 0) return { items: [], hasMore: false, nextSkip: null };
      return buildFeedItems(ctx, input, followingIds);
    }),
});
