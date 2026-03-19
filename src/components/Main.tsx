import PostCard from "src/components/Feed/PostCard";
import VideoCard from "src/components/Feed/VideoCard";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFeed"]["items"][number];

export default function Main() {
  const { data, isLoading, isError } = trpc.feed.getFeed.useQuery({
    skip: 0,
    limit: 20,
  });

  return (
    <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
      <div className="flex flex-col items-center pb-5 md:items-start md:px-5">
        {isLoading && (
          <p className="py-8 text-sm text-gray-400">Loading feed...</p>
        )}
        {isError && (
          <p className="py-8 text-sm text-red-400">Could not load feed.</p>
        )}
        {!isLoading && !isError && data?.items.length === 0 && (
          <p className="py-8 text-sm text-gray-400">
            No posts yet. Be the first to create something!
          </p>
        )}
        {data?.items.map((item: FeedItem) => {
          if (item.type === "video") {
            return <VideoCard key={`video-${item.id}`} video={item.data} />;
          }
          if (item.type === "post") {
            return <PostCard key={`post-${item.id}`} post={item.data} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}
