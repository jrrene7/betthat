import Link from "next/link";
import HeartRed from "src/icons/HeartRed";
import Message from "src/icons/Message";

interface Props {
  videoId: string;
  videoUrl: string;
  likes: number;
  commentCount: number;
}

export default function VideoPlayer({ videoId, videoUrl, likes, commentCount }: Props) {
  const isFlipped = false;

  return (
    <div className="relative flex items-end">
      <Link
        href={`/video/${videoId}`}
        className={`mt-3 ${
          isFlipped
            ? "aspect-[9/16] w-[200px] md:w-[289px]"
            : "aspect-auto md:flex-1"
        } relative max-w-full overflow-hidden rounded-md bg-[#222]`}
      >
        <video
          src={videoUrl}
          loop
          muted
          playsInline
          className="h-full w-full rounded-md"
        />
      </Link>

      <div className="ml-2 pr-2 md:ml-5">
        <div className="mb-2 flex flex-col items-center">
          <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#2f2f2f] md:h-12 md:w-12">
            <HeartRed />
          </div>
          <p className="mt-2 text-[12px] font-normal text-[#fffffb]">{likes}</p>
        </div>
        <Link href={`/video/${videoId}`}>
          <div className="flex flex-col items-center">
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#2f2f2f] md:h-12 md:w-12">
              <Message />
            </div>
            <p className="mt-2 text-[12px] font-normal text-[#fffffb]">
              {commentCount}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
