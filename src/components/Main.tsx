import VideoItem from "src/components/Video/VideoItem";
import { trpc } from "src/utils/trpc";

interface Props {}

export default function Main({}: Props) {
  const { data, isLoading, isError } = trpc.video.getVideo.useQuery({
    cursor: 0,
    limit: 20,
  });

  return (
    <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
      <div className="flex flex-col items-center pb-5 md:items-start md:px-5">
        {isLoading && <p className="py-8 text-sm text-gray-400">Loading videos...</p>}
        {isError && <p className="py-8 text-sm text-red-400">Could not load videos.</p>}
        {!isLoading && !isError && data?.videos.length === 0 && (
          <p className="py-8 text-sm text-gray-400">No videos yet.</p>
        )}
        {data?.videos.map((video) => (
          <VideoItem key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
