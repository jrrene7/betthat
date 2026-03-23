import { publicProcedure, protectedProcedure, router } from "src/server/trpc/trpc";
import { Visibility } from "@prisma/client";
import { z } from "zod";

const postInclude = {
  author: true,
  video: true,
  _count: { select: { likes: true, comments: true } },
} as const;

const betInclude = {
  creator: true,
  opponent: true,
  winner: true,
} as const;

const challengeInclude = {
  creator: true,
  _count: { select: { participants: true, submissions: true } },
} as const;

async function buildFeedItems(
  ctx: any,
  input: { skip: number; limit: number; type?: string },
  authorIdFilter?: string[]
) {
  const { skip, limit } = input;
  const type = input.type ?? "all";
  const fetchCount = skip + limit;

  const postWhere = {
    isPublished: true,
    ...(authorIdFilter ? { authorId: { in: authorIdFilter } } : {}),
  };
  const betWhere = {
    NOT: { visibility: { in: [Visibility.UNLISTED, Visibility.PRIVATE] } },
    ...(authorIdFilter
      ? { OR: [{ creatorId: { in: authorIdFilter } }, { opponentId: { in: authorIdFilter } }] }
      : {}),
  };
  const challengeWhere = {
    NOT: { visibility: { in: [Visibility.UNLISTED, Visibility.PRIVATE] } },
    ...(authorIdFilter ? { creatorId: { in: authorIdFilter } } : {}),
  };

  const [posts, bets, challenges] = await Promise.all([
    (type === "all" || type === "post") ? ctx.prisma.post.findMany({
      where: postWhere,
      include: postInclude,
      orderBy: { createdAt: "desc" },
      take: fetchCount,
    }) : Promise.resolve([]),
    (type === "all" || type === "bet") ? ctx.prisma.bet.findMany({
      where: betWhere,
      include: betInclude,
      orderBy: { createdAt: "desc" },
      take: fetchCount,
    }) : Promise.resolve([]),
    (type === "all" || type === "challenge") ? ctx.prisma.challenge.findMany({
      where: challengeWhere,
      include: challengeInclude,
      orderBy: { createdAt: "desc" },
      take: fetchCount,
    }) : Promise.resolve([]),
  ]);

  let likedPostIds = new Set<string>();
  if (ctx.session?.user && posts.length > 0) {
    const postLikes = await ctx.prisma.postLike.findMany({
      where: { userId: ctx.session.user.id, postId: { in: posts.map((p: any) => p.id) } },
      select: { postId: true },
    });
    likedPostIds = new Set(postLikes.map((l: any) => l.postId));
  }

  const postItems = posts.map((p: any) => ({
    type: "post" as const,
    id: p.id,
    createdAt: p.createdAt,
    data: { ...p, isLike: likedPostIds.has(p.id) },
  }));
  const betItems = bets.map((b: any) => ({
    type: "bet" as const,
    id: b.id,
    createdAt: b.createdAt,
    data: b,
  }));
  const challengeItems = challenges.map((c: any) => ({
    type: "challenge" as const,
    id: c.id,
    createdAt: c.createdAt,
    data: c,
  }));

  const merged = [...postItems, ...betItems, ...challengeItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const page = merged.slice(skip, skip + limit);
  const hasMore = merged.length > skip + limit;
  return { items: page, hasMore, nextSkip: hasMore ? skip + limit : null };
}

export const feedRouter = router({
  getFeed: publicProcedure
    .input(z.object({
      skip: z.number().default(0),
      limit: z.number().default(10),
      type: z.enum(["all", "post", "bet", "challenge"]).default("all"),
    }))
    .query(async ({ ctx, input }) => buildFeedItems(ctx, input)),

  getFollowingFeed: protectedProcedure
    .input(z.object({
      skip: z.number().default(0),
      limit: z.number().default(10),
      type: z.enum(["all", "post", "bet", "challenge"]).default("all"),
    }))
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
