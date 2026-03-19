import { useSession } from "next-auth/react";
import Link from "next/link";
import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import PostCard from "src/components/Feed/PostCard";
import VideoCard from "src/components/Feed/VideoCard";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFollowingFeed"]["items"][number];

export default function FollowingPage() {
  const { data: session, status } = useSession();
  const { data, isLoading, isError } = trpc.feed.getFollowingFeed.useQuery(
    { skip: 0, limit: 20 },
    { enabled: !!session?.user }
  );

  return (
    <AppLayout>
      <Sidebar />
      <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
        <div className="flex flex-col items-center pb-5 md:items-start md:px-5">

          {status === "unauthenticated" && (
            <div className="py-16 text-center">
              <p className="text-gray-400">Sign in to see posts from people you follow.</p>
              <Link href="/sign-in" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-semibold">
                Sign in
              </Link>
            </div>
          )}

          {status === "authenticated" && isLoading && (
            <p className="py-8 text-sm text-gray-400">Loading...</p>
          )}

          {status === "authenticated" && isError && (
            <p className="py-8 text-sm text-red-400">Could not load feed.</p>
          )}

          {status === "authenticated" && !isLoading && !isError && data?.items.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-400">Nothing here yet.</p>
              <p className="mt-1 text-sm text-gray-500">Follow some people to see their posts and videos here.</p>
            </div>
          )}

          {data?.items.map((item: FeedItem) => {
            if (item.type === "video") return <VideoCard key={`video-${item.id}`} video={item.data} />;
            if (item.type === "post") return <PostCard key={`post-${item.id}`} post={item.data} />;
            return null;
          })}

        </div>
      </div>
    </AppLayout>
  );
}
