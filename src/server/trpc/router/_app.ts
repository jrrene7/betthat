import { router } from "src/server/trpc/trpc";
import { likeRouter } from "./like";
import { followRouter } from "./follow";
import { videoRouter } from "./video";
import { commentRouter } from "./comment";
import { postRouter } from "./post";
import { betRouter } from "./bet";
import { challengeRouter } from "./challenge";
import { feedRouter } from "./feed";
import { userRouter } from "./user";
import { notificationRouter } from "./notification";

export const appRouter = router({
    like: likeRouter,
    follow: followRouter,
    video: videoRouter,
    comment: commentRouter,
    post: postRouter,
    bet: betRouter,
    challenge: challengeRouter,
    feed: feedRouter,
    user: userRouter,
    notification: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
