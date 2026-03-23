import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "src/server/trpc/context";
import superjson from "superjson";
import logger from "src/server/logger";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (shape.data.httpStatus >= 500) {
      logger.error("tRPC internal error", {
        path: shape.data.path,
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
    }
    return shape;
  },
});

export const router = t.router;

/**
 * Logging middleware — runs on every procedure
 */
const withLogging = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const userId = ctx.session?.user?.id ?? "anon";
  const result = await next();
  const ms = Date.now() - start;
  if (result.ok) {
    logger.info(`${type} ${path}`, { userId, ms });
  } else {
    const err = result.error;
    const level = err.code === "INTERNAL_SERVER_ERROR" ? "error" : "warn";
    logger[level](`${type} ${path} failed`, { userId, ms, code: err.code, message: err.message });
  }
  return result;
});

/**
 * Reusable middleware to ensure
 * users are logged in
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Public procedure (unauthenticated, with logging)
 **/
export const publicProcedure = t.procedure.use(withLogging);

/**
 * Protected procedure
 **/
export const protectedProcedure = t.procedure.use(withLogging).use(isAuthed);
