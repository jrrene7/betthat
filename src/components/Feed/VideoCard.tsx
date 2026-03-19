import { useState } from "react";
import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import VideoPlayer from "src/components/Video/VideoPlayer";
import MusicNote from "src/icons/MusicNote";
import { getUsername } from "src/utils";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFeed"]["items"][number];
type FeedVideoItem = Extract<FeedItem, { type: "video" }>;

interface Props {
  video: FeedVideoItem["data"];
}

export default function VideoCard({ video }: Props) {
  const { data: session } = useSession();
  const [isLike, setIsLike] = useState(video.isLike);
  const [likeCount, setLikeCount] = useState(video._count.likes);

  const { mutate: toggleLike } = trpc.like.likeVideo.useMutation({
    onError: () => {
      toast.error("Something went wrong");
      setIsLike((prev: boolean) => !prev);
      setLikeCount((prev: number) => (isLike ? prev + 1 : prev - 1));
    },
  });

  function handleLike() {
    if (!session?.user) { toast.error("You must be logged in!"); return; }
    setIsLike((prev: boolean) => !prev);
    setLikeCount((prev: number) => (isLike ? prev - 1 : prev + 1));
    toggleLike({ videoId: video.id });
  }

  if (!video.user) return null;
  const userDisplayName = video.user.name ?? "Unknown";

  return (
    <div
      id={`video-${video.id}`}
      className="flex w-full items-start justify-between border-b border-[#2f2f2f] py-5 sm:pr-0 md:pr-2 lg:pr-0"
    >
      <div className="flex w-full">
        <Link href={`/account/${video.user.id}`} className="hidden h-[56px] w-[56px] lg:block">
          <LazyLoadImage src={video.user.image ?? undefined} className="rounded-full" effect="opacity" />
        </Link>
        <div className="mx-3 flex-1">
          <div className="flex items-start justify-between">
            <Link href={`/account/${video.user.id}`} className="flex items-center">
              <div className="mr-3 block h-[56px] w-[56px] lg:hidden">
                <LazyLoadImage src={video.user.image ?? undefined} className="rounded-full" effect="opacity" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <h3 className="line-clamp-1 text-[16px] font-bold hover:underline">
                  @{getUsername(userDisplayName)}
                </h3>
                <p className="line-clamp-1 text-sm text-[rgba(255,255,255,0.75)] hover:underline md:ml-2">
                  {userDisplayName}
                </p>
              </div>
            </Link>
          </div>
          <p className="line-clamp-2 mt-2 text-sm font-normal">{video.title}</p>
          <p className="mt-2 flex items-center text-sm font-semibold">
            <MusicNote />
            <span className="line-clamp-1 ml-1">Soundtrack - {userDisplayName}</span>
          </p>
          <VideoPlayer
            videoId={video.id}
            videoUrl={video.videoUrl}
            likes={likeCount}
            commentCount={video._count.comment}
            isLike={isLike}
            onLike={handleLike}
          />
        </div>
      </div>
    </div>
  );
}
