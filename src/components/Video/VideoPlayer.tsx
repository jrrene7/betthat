import Link from "next/link";
import HeartRed from "src/icons/HeartRed";
import HeartWhite from "src/icons/HeartWhite";
import Message from "src/icons/Message";
import { getCloudinaryPlaybackUrl } from "src/utils/cloudinary";

interface Props {
  videoId: string;
  videoUrl: string;
  likes: number;
  commentCount: number;
  isLike?: boolean;
  onLike?: () => void;
}

export default function VideoPlayer({
  videoId,
  videoUrl,
  likes,
  commentCount,
  isLike,
  onLike,
}: Props) {
  return (
    <div className="relative flex items-end">
      <Link
        href={`/video/${videoId}`}
        className="relative mt-3 aspect-auto max-w-full overflow-hidden rounded-md bg-[#222] md:flex-1"
      >
        <video
          src={getCloudinaryPlaybackUrl(videoUrl)}
          loop
          muted
          playsInline
          className="h-full w-full rounded-md"
        />
      </Link>

      <div className="ml-2 pr-2 md:ml-5">
        {/* Like button */}
        <div className="mb-2 flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onLike?.(); }}
            className={`flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#2f2f2f] transition-transform active:scale-90 md:h-12 md:w-12 ${onLike ? "cursor-pointer hover:bg-[#3f3f3f]" : "cursor-default"}`}
          >
            {isLike ? <HeartRed /> : <HeartWhite />}
          </button>
          <p className="mt-2 text-[12px] font-normal text-[#fffffb]">{likes}</p>
        </div>

        {/* Comment button */}
        <Link href={`/video/${videoId}`}>
          <div className="flex flex-col items-center">
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#2f2f2f] hover:bg-[#3f3f3f] md:h-12 md:w-12">
              <Message />
            </div>
            <p className="mt-2 text-[12px] font-normal text-[#fffffb]">{commentCount}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
