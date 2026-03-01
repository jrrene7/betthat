import { ChallengeParticipantRole } from "@prisma/client";
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

export const challengeRouter = router({
  createChallenge: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(150),
        description: z.string().trim().max(5000).optional().nullable(),
        participantIds: z.array(z.string()).max(20).optional(),
        startsAt: z.string().optional().nullable(),
        endsAt: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startsAt = parseOptionalDate(input.startsAt);
      const endsAt = parseOptionalDate(input.endsAt);

      if (startsAt && endsAt && startsAt > endsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge start date must be before end date.",
        });
      }

      const participantIds = Array.from(
        new Set((input.participantIds ?? []).filter((id) => id !== ctx.session.user.id))
      );

      if (participantIds.length > 0) {
        const foundUsers = await ctx.prisma.user.findMany({
          where: { id: { in: participantIds } },
          select: { id: true },
        });

        if (foundUsers.length !== participantIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more selected participants do not exist.",
          });
        }
      }

      const challenge = await ctx.prisma.challenge.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          creatorId: ctx.session.user.id,
          startsAt,
          endsAt,
          participants: {
            create: [
              {
                userId: ctx.session.user.id,
                role: ChallengeParticipantRole.CREATOR,
              },
              ...participantIds.map((userId) => ({
                userId,
                role: ChallengeParticipantRole.PARTICIPANT,
              })),
            ],
          },
        },
        include: {
          creator: true,
          participants: {
            include: {
              user: true,
            },
          },
          bets: true,
        },
      });

      return { challenge };
    }),
});
