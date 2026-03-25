import { useState } from "react";
import PostCard from "src/components/Feed/PostCard";
import BetCard from "src/components/Feed/BetCard";
import ChallengeCard from "src/components/Feed/ChallengeCard";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFeed"]["items"][number];
type FeedType = "all" | "post" | "bet" | "challenge";

const FEED_TABS: { key: FeedType; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "post",      label: "Posts" },
  { key: "bet",       label: "Bets" },
  { key: "challenge", label: "Challenges" },
];

export default function Main() {
  const [feedType, setFeedType] = useState<FeedType>("all");

  const { data, isLoading, isError } = trpc.feed.getFeed.useQuery({
    skip: 0,
    limit: 20,
    type: feedType,
  });

  return (
    <div className="flex-1 lg:ml-[348px] lg:mt-5">
      {/* Type filter tabs */}
      <div className="flex border-b border-[#1e1e1e]">
        {FEED_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFeedType(key)}
            className={`px-5 py-3 text-sm font-semibold transition-colors ${
              feedType === key
                ? "border-b-2 border-primary text-primary"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col pb-24 lg:pb-5">
        {isLoading && (
          <div className="w-full">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full border-b border-[#1e1e1e] py-4">
                <div className="flex gap-3 px-4">
                  <div className="h-[56px] w-[56px] flex-shrink-0 animate-pulse rounded-full bg-[#2f2f2f]" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-[#2f2f2f]" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-[#2f2f2f]" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#2f2f2f]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isError && (
          <p className="py-8 text-sm text-red-400">Could not load feed.</p>
        )}
        {!isLoading && !isError && data?.items.length === 0 && (
          <p className="py-8 text-sm text-gray-400">
            {feedType === "all"
              ? "No posts yet. Be the first to create something!"
              : `No ${feedType}s yet.`}
          </p>
        )}
        {data?.items.map((item: FeedItem) => {
          if (item.type === "post") return <PostCard key={item.id} post={item.data} />;
          if (item.type === "bet") return <BetCard key={item.id} bet={item.data} />;
          if (item.type === "challenge") return <ChallengeCard key={item.id} challenge={item.data} />;
          return null;
        })}
      </div>
    </div>
  );
}
