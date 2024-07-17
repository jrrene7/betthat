import { router } from "src/server/trpc/trpc";
import { likeRouter } from "./like";
import { followRouter } from "./follow";
import { videoRouter } from "./video";
import { commentRouter } from "./comment";

export const appRouter = router({
    like: likeRouter,
    follow: followRouter,
    video: videoRouter,
    comment: commentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
