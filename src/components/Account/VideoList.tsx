import { useMemo, useState } from "react";
import VideoSmall from "src/components/Video/VideoSmall";
import { Profile } from "src/types";

interface Props {
  profile: Profile;
}

export default function VideoList({ profile }: Props) {
  const [type, setType ] = useState<"video" | "like">('video')
  const videos = useMemo(() => {
    if (type === 'video') {
      return profile?.video?.map(item => ({
        title: item.title,
        videoUrl: item.videoUrl,
        id: item.id,
      }))
    } else {
      return profile?.likes?.map((item) => ({
        title: item.video.title,
        videoUrl: item.video.videoUrl,
        id: item.id,
      }));
    }
  }, [type, profile]);
  return (
    <>
      <ul className="flex w-full items-center">
        <li
        onClick={() => setType('video')}
          className={`w-[50%] cursor-pointer px-14 py-2 text-center lg:w-auto ${
            type === "video" && "border-b-[2px] border-primary font-bold text-primary"
          }`}
        >
          Videos
        </li>
        <li
        onClick={() => setType('like')}
          className={`w-[50%] cursor-pointer px-14 py-2 text-center lg:w-auto ${
            type === "like" && "border-b-[2px] border-primary font-bold text-primary"
          }`}
        >
          Likes
        </li>
      </ul>
      {videos.length === 0 && <h3 className="mt-5 w-full text-center">No videos have been { type === "like" ? "liked" : "shared"}.</h3>}
      <div className="grid grid-cols-3 gap-1 pb-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 xl:px-0">
        {videos?.map(video => (
          <VideoSmall key={video?.id} video={video} />
        ))}
      </div>
    </>
  );
}
