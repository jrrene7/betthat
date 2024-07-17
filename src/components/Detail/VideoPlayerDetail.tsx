import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { CircularProgress } from "react-cssfx-loading";
import ArrowBack from "src/icons/ArrowBack";
import LogoSmall from "src/icons/LogoSmall";
import Controls from "../Controls";

interface Props {
  poster: string;
  videoUrl: string;
}

export default function VideoPlayerDetail({ poster, videoUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const router = useRouter();
  return (
    <div className="relative z-[9999] h-full w-full lg:flex-1">
      <video
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        ref={videoRef}
        src={videoUrl}
        poster={poster}
        loop
        className="h-full w-full"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularProgress color="#fff" />
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute left-0 top-0 z-[9999] flex items-center p-2 lg:p-5"
      >
        <div
          onClick={router.back}
          className="mr-5 flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#2f2f2f]"
        >
          <ArrowBack />
        </div>
        <Link href="/">
          <LogoSmall />
        </Link>
      </div>
      <Controls
        setSound={() => setIsSoundOn((prev) => !prev)}
        isSoundOn={isSoundOn}
        showSeekTime
        videoRef={videoRef}
      />
    </div>
  );
}
