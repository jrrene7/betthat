import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "src/server/trpc/trpc";
import { z } from "zod";

function parseOptionalDate(value: string | null | undefined) {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid date value.",
    });
  }

  return date;
}

export const betRouter = router({
  createBet: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(150),
        description: z.string().trim().max(5000).optional().nullable(),
        opponentId: z.string().min(1),
        dueAt: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.opponentId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot create a bet with yourself.",
        });
      }

      const opponent = await ctx.prisma.user.findUnique({
        where: { id: input.opponentId },
        select: { id: true },
      });

      if (!opponent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected opponent was not found.",
        });
      }

      const bet = await ctx.prisma.bet.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          creatorId: ctx.session.user.id,
          opponentId: input.opponentId,
          dueAt: parseOptionalDate(input.dueAt),
        },
        include: {
          creator: true,
          opponent: true,
          winner: true,
          challenge: true,
        },
      });

      return { bet };
    }),
});
