import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import VideoPlayer from "src/components/Video/VideoPlayer";
import MusicNote from "src/icons/MusicNote";
import { getUsername } from "src/utils";
import { RouterOutputs } from "src/utils/trpc";

interface Props {
  video: RouterOutputs["video"]["getVideo"]["videos"][number];
}

export default function VideoItem({ video }: Props) {
  if (!video.user) return null;
  const userDisplayName = video.user.name ?? "Unknown";

  return (
    <div
      id={`video-${video.id}`}
      className="flex w-full items-start justify-between border-b border-[#2f2f2f] py-5 sm:pr-0 md:pr-2 lg:pr-0"
    >
      <div className="flex w-full">
        <Link
          href={`/account/${video.user.id}`}
          className="hidden h-[56px] w-[56px] lg:block"
        >
          <LazyLoadImage
            src={video.user.image ?? undefined}
            className="rounded-full"
            effect="opacity"
          />
        </Link>
        <div className="mx-3 flex-1">
          <div>
            <div className="flex items-start justify-between">
              <Link href={`/account/${video.user.id}`} className="flex items-center">
                <div className="mr-3 block h-[56px] w-[56px] lg:hidden">
                  <LazyLoadImage
                    src={video.user.image ?? undefined}
                    className="rounded-full"
                    effect="opacity"
                  />
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
          </div>
          <p className="line-clamp-2 mt-2 text-sm font-normal">{video.title}</p>
          <p className="mt-2 flex items-center text-sm font-semibold">
            <MusicNote />{" "}
            <span className="line-clamp-1">Soundtrack - {userDisplayName}</span>
          </p>
          <VideoPlayer
            videoId={video.id}
            videoUrl={video.videoUrl}
            likes={video._count.likes}
            commentCount={video._count.comment}
          />
        </div>
      </div>
    </div>
  );
}
