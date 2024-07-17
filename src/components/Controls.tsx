import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Pause from "src/icons/Pause";
import Play from "src/icons/Play";
import SoundOff from "src/icons/SoundOff";
import SoundOn from "src/icons/SoundOn";
import { formatVideoTime } from "src/utils";

interface Props {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  showSeekTime?: boolean;
  setSound: () => void;
  isSoundOn: boolean;
}

export default function Controls(props: Props) {
  const { videoRef, showSeekTime, isSoundOn, setSound } = props;
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlay, setIsPlay] = useState(false);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const progress = progressRef?.current;
  const video = videoRef?.current;
  const volume = volumeRef?.current;
  const percentElapsed = useMemo(
    () => (currentTime * 100) / video?.duration!,
    [currentTime, video]
  );
  const playVideo = () => setIsPlay(true);
  const pauseVideo = () => setIsPlay(false);

  const onSeekTime = useCallback(
    (e: any) => {
      const clientX = e?.clientX || e?.touches[0]?.clientX;
      const left = progress?.getBoundingClientRect().left!;
      const width = progress?.getBoundingClientRect().width!;
      const percent = (clientX - left) / width;

      document.body.style.userSelect = "none";

      if (clientX <= left) {
        if (video) {
          video.currentTime = 0;
        }
        setCurrentTime(0);
        return;
      }

      if (clientX >= width + left) {
        if (video) {
          video.currentTime = video?.duration;
          setCurrentTime(video?.duration);
        }
        return;
      }

      if (video) {
        video.currentTime = percent * video?.duration;
      }

      if (video) {
        setCurrentTime(percent * video.duration);
      }
    },
    [progress, video]
  );

  function togglePlay() {
    if (isPlay && videoRef.current?.play) {
      videoRef.current?.pause();
      pauseVideo();
    } else {
      videoRef.current?.play();
      playVideo();
    }
  }

  // handle seek when click progressbar
  useEffect(() => {
    progress?.addEventListener("click", onSeekTime);

    return () => {
      progress?.addEventListener("click", onSeekTime);
    };
  }, [onSeekTime, progress]);

  // handle toggle sound
  useEffect(() => {
    if (isSoundOn) {
      if (video) {
        video.muted = false;
      }
    } else {
      if (video) {
        video.muted = true;
      }
    }
  }, [isSoundOn, video]);

  // handle time update
  useEffect(() => {
    const onTimeUpdate = () => setCurrentTime(video?.currentTime!);
    video?.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      video?.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [onSeekTime, video]);

  // handle seek time in pc with mouse event
  useEffect(() => {
    progress?.addEventListener("mousedown", () => {
      document.addEventListener("mousemove", onSeekTime);
    });

    return () => {
      progress?.removeEventListener("mousedown", () => {
        document.addEventListener("mousemove", onSeekTime);
      });
    };
  }, [progress, onSeekTime]);

  // remove mouse move when mouse up
  useEffect(() => {
    document?.addEventListener("mouseup", () => {
      document.body.style.userSelect = "auto";
      document.removeEventListener("mousemove", onSeekTime);
    });

    return () => {
      document?.removeEventListener("mouseup", () => {
        document.body.style.userSelect = "auto";
        document.removeEventListener("mousemove", onSeekTime);
      });
    };
  }, [onSeekTime]);

  // handle state isPlay when audio onPlay, onPause
  useEffect(() => {
    video?.addEventListener("play", playVideo);
    video?.addEventListener("pause", pauseVideo);

    return () => {
      video?.removeEventListener("play", playVideo);
      video?.removeEventListener("pause", pauseVideo);
    };
  }, [onSeekTime, video]);

  // handle seek time in mobile with touch event
  useEffect(() => {
    progress?.addEventListener("touchstart", () => {
      document.addEventListener("touchmove", onSeekTime);
    });

    return () => {
      progress?.removeEventListener("touchstart", () => {
        document.addEventListener("touchmove", onSeekTime);
      });
    };
  }, [onSeekTime, progress]);

  useEffect(() => {
    progress?.addEventListener("touchend", () => {
      document.removeEventListener("touchmove", onSeekTime);
    });

    return () => {
      progress?.removeEventListener("touchend", () => {
        document.removeEventListener("touchmove", onSeekTime);
      });
    };
  }, [onSeekTime, progress]);

  useEffect(() => {
    volume?.addEventListener("click", onSeekTime);

    return () => {
      volume?.removeEventListener("click", onSeekTime);
    };
  }, [volume, onSeekTime]);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[9998] flex items-center p-2 lg:p-5"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex w-full items-center justify-between">
          <div
            onClick={togglePlay}
            className="mr-2 flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#2f2f2f] lg:mr-4"
          >
            {isPlay ? <Pause /> : <Play />}
          </div>
          <div
            onClick={() => setSound()}
            className="ml-2 flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#2f2f2f] lg:ml-5"
          >
            {isSoundOn ? <SoundOn /> : <SoundOff />}
          </div>
        </div>

        <div
          style={{ display: showSeekTime ? "flex" : "none" }}
          className="mt-4 flex flex-1 items-center"
        >
          <p className="text-sm font-semibold">
            {formatVideoTime(currentTime)}
          </p>
          <div
            ref={progressRef}
            className="relative mx-2 flex-1 cursor-pointer py-3 lg:mx-4"
          >
            <div className="relative h-[3px] w-full overflow-hidden rounded-sm bg-gray-400">
              <div
                style={{ width: `${percentElapsed}%` }}
                className={`absolute bottom-0 top-0 bg-primary`}
              />
            </div>
            <div
              style={{ left: `${percentElapsed}%` }}
              className="absolute top-[50%] h-[10px] w-[10px] translate-y-[-50%] rounded-full bg-primary"
            />
          </div>
          <p className="text-sm font-semibold">
            {formatVideoTime(videoRef?.current?.duration)}
          </p>
        </div>
      </div>
    </div>
  );
}
