import { PrismaClient } from "@prisma/client";
import logger from "src/server/logger";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const isDev = process.env.NODE_ENV !== "production";

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: isDev
      ? [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ]
      : [
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ],
  });

prisma.$on("query" as never, (e: { query: string; params: string; duration: number }) => {
  logger.debug("prisma query", { query: e.query, params: e.params, ms: e.duration });
});

prisma.$on("error" as never, (e: { message: string; target: string }) => {
  logger.error("prisma error", { message: e.message, target: e.target });
});

prisma.$on("warn" as never, (e: { message: string }) => {
  logger.warn("prisma warn", { message: e.message });
});

if (isDev) {
  global.prisma = prisma;
}
