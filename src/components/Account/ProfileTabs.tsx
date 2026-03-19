import { useState } from "react";
import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import VideoSmall from "src/components/Video/VideoSmall";
import { Profile } from "src/types";
import { trpc } from "src/utils/trpc";
import { calculateCreatedTime } from "src/utils";

type Tab = "videos" | "posts" | "bets" | "likes";

interface Props {
  profile: Profile;
}

function statusColor(status: string) {
  switch (status) {
    case "PENDING":   return "bg-yellow-500/20 text-yellow-400";
    case "ACTIVE":    return "bg-green-500/20 text-green-400";
    case "SETTLED":   return "bg-blue-500/20 text-blue-400";
    case "DECLINED":  return "bg-red-500/20 text-red-400";
    default:          return "bg-gray-500/20 text-gray-400";
  }
}

export default function ProfileTabs({ profile }: Props) {
  const [tab, setTab] = useState<Tab>("videos");

  const { data: postsData, isLoading: postsLoading } = trpc.post.getPosts.useQuery(
    { authorId: profile.id, limit: 20 },
    { enabled: tab === "posts" }
  );

  const { data: betsData, isLoading: betsLoading } = trpc.bet.getUserBets.useQuery(
    { userId: profile.id },
    { enabled: tab === "bets" }
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "videos", label: "Videos" },
    { key: "posts",  label: "Posts" },
    { key: "bets",   label: "Bets" },
    { key: "likes",  label: "Likes" },
  ];

  return (
    <>
      {/* Tab bar */}
      <ul className="flex w-full border-b border-[#2f2f2f]">
        {TABS.map(({ key, label }) => (
          <li
            key={key}
            onClick={() => setTab(key)}
            className={`cursor-pointer px-8 py-3 text-sm font-semibold transition-colors ${
              tab === key
                ? "border-b-2 border-primary text-primary"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {label}
          </li>
        ))}
      </ul>

      <div className="px-4 pb-10 xl:px-0">
        {/* Videos */}
        {tab === "videos" && (
          <>
            {profile.video.length === 0 && (
              <p className="mt-8 text-center text-sm text-gray-500">No videos yet.</p>
            )}
            <div className="grid grid-cols-3 gap-1 pt-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {profile.video.map((video) => (
                <VideoSmall key={video.id} video={video} />
              ))}
            </div>
          </>
        )}

        {/* Posts */}
        {tab === "posts" && (
          <div className="mx-auto mt-4 max-w-xl">
            {postsLoading && <p className="py-8 text-center text-sm text-gray-500">Loading...</p>}
            {!postsLoading && postsData?.posts.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">No posts yet.</p>
            )}
            <div className="flex flex-col gap-4">
              {postsData?.posts.map((post) => (
                <div key={post.id} className="rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] p-4">
                  <div className="flex items-center justify-between">
                    {post.title && (
                      <p className="font-semibold">{post.title}</p>
                    )}
                    <span className="ml-auto text-xs text-gray-500">
                      {calculateCreatedTime(post.createdAt)}
                    </span>
                  </div>
                  {post.content && (
                    <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{post.content}</p>
                  )}
                  {post.video && (
                    <div className="mt-3 overflow-hidden rounded-lg">
                      <video
                        src={post.video.videoUrl}
                        controls
                        muted
                        className="max-h-[320px] w-full bg-black object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bets */}
        {tab === "bets" && (
          <div className="mx-auto mt-4 max-w-xl">
            {betsLoading && <p className="py-8 text-center text-sm text-gray-500">Loading...</p>}
            {!betsLoading && betsData?.bets.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">No bets yet.</p>
            )}
            <div className="flex flex-col gap-3">
              {betsData?.bets.map((bet) => (
                <Link
                  key={bet.id}
                  href={`/bet/${bet.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] p-4 transition-colors hover:border-[#3f3f3f]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug">{bet.title}</p>
                    <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${statusColor(bet.status)}`}>
                      {bet.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <LazyLoadImage
                      src={bet.creator.image ?? undefined}
                      className="h-5 w-5 rounded-full"
                      effect="opacity"
                    />
                    <span>{bet.creator.name ?? "Unknown"}</span>
                    <span>vs</span>
                    <LazyLoadImage
                      src={bet.opponent.image ?? undefined}
                      className="h-5 w-5 rounded-full"
                      effect="opacity"
                    />
                    <span>{bet.opponent.name ?? "Unknown"}</span>
                    <span className="ml-auto">{calculateCreatedTime(bet.createdAt)}</span>
                  </div>
                  {bet.status === "SETTLED" && bet.winner && (
                    <p className="text-xs font-semibold text-green-400">
                      Winner: {bet.winner.name ?? "Unknown"}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Likes */}
        {tab === "likes" && (
          <>
            {profile.likes.length === 0 && (
              <p className="mt-8 text-center text-sm text-gray-500">No liked videos yet.</p>
            )}
            <div className="grid grid-cols-3 gap-1 pt-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {profile.likes.map((like) => (
                <VideoSmall
                  key={like.id}
                  video={{ id: like.video.id, title: like.video.title, videoUrl: like.video.videoUrl }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
