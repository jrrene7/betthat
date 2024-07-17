import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import VideoPlayer from "src/components/Video/VideoPlayer";
import MusicNote from "src/icons/MusicNote";

interface Props {}

export default function VideoItem({}: Props) {
  const disabled = true;
  const isFollow = false;

  return (
    <div
      id={`video-`}
      className={`flex w-full items-start justify-between border-b border-[#2f2f2f] py-5 sm:pr-0 md:pr-2 lg:pr-0`}
    >
      <div className="flex w-full">
        <Link
          href={`/account/video.user.id`}
          className="hidden h-[56px] w-[56px] lg:block"
        >
          <LazyLoadImage className="rounded-full" effect="opacity" />
        </Link>
        <div className="mx-3 flex-1">
          <div>
            <div className="flex items-start justify-between">
              <Link
                href={`/account/video.user.id`}
                className="flex items-center"
              >
                <div className="mr-3 block h-[56px] w-[56px] lg:hidden">
                  <LazyLoadImage className="rounded-full" effect="opacity" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center">
                  <h3 className="line-clamp-1 text-[16px] font-bold hover:underline">
                    @username
                  </h3>
                  <p className="line-clamp-1 text-sm text-[rgba(255,255,255,0.75)] hover:underline md:ml-2">
                    name
                  </p>
                </div>
              </Link>
              <button
                disabled={disabled}
                className={`rounded-[4px] border ${
                  isFollow
                    ? "border-transparent text-white"
                    : "border-primary text-primary"
                } bg-[#2f2f2f] py-1 ${
                  disabled && "cursor-not-allowed opacity-40"
                } mt-3 block px-4 text-[15px] font-semibold md:hidden lg:ml-4 lg:mt-0`}
              >
                Following
              </button>
            </div>
          </div>
          <p className="line-clamp-2 mt-2 text-sm font-normal">title</p>
          <p className="mt-2 flex items-center text-sm font-semibold">
            <MusicNote />{" "}
            <span className="line-clamp-1">Soundtrack - username</span>
          </p>
          <VideoPlayer />
        </div>
      </div>
      <button
        disabled={disabled}
        className={`rounded-[4px] border ${
          isFollow
            ? "border-transparent text-white"
            : "border-primary text-primary"
        } bg-[#2f2f2f] py-1 ${
          disabled && "cursor-not-allowed opacity-40"
        } hidden px-4 text-[15px] font-semibold md:block`}
      >
        Following
      </button>
    </div>
  );
}
