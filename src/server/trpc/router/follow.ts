import { protectedProcedure, publicProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

export const followRouter = router({
  getAccountFollowing: protectedProcedure.query(async ({ ctx }) => {
    const followings = await ctx.prisma.follow.findMany({
      where: {
        followerId: ctx.session.user.id,
      },
      include: {
        following: true,
      },
    });
   const accounts = await ctx.prisma.user.findMany({
      where: {
        id: {
          in: followings.map((item) => item.followingId),
        },
      },
      include: {
        _count: {
          select: {
            followers: true,
            followings: true,
          },
        },
      },
    })
    return { accounts };
  }),
  getAccountSuggestion: publicProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.prisma.user.findMany({
      where: {
        id: {
          not: ctx.session?.user?.id,
        },
      },
      include: {
        _count: {
          select: {
            followers: true,
            followings: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: "desc",
        },
      },
      take: 10,
    });
    return { accounts };
  }),
  followUser: protectedProcedure
    .input(z.object({ followingId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const follow = await ctx.prisma.follow.findMany({
        where: {
          followerId: ctx?.session?.user?.id,
          followingId: input.followingId!,
        },
      });
      if (follow.length > 0) {
        return ctx.prisma.follow.delete({
          where: {
            id: follow[0]?.id,
          },
        });  
      } else {
        return ctx.prisma.follow.create({
          data: {
            followerId: ctx?.session?.user?.id,
            followingId: input.followingId!
          },
        });
      }
    }),
});
