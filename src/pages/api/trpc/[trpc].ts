import { createNextApiHandler } from "@trpc/server/adapters/next";
import { createContext } from "src/server/trpc/context";
import { appRouter } from "src/server/trpc/router/_app";
import { PRODUCTION } from "src/utils";

// Cap request body size to prevent large-payload abuse
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError: PRODUCTION
    ? undefined
    : ({ path, error }) => {
        console.error(`❌ tRPC failed on ${path}: ${error}`);
      },
});
