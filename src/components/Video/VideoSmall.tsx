import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { getCloudinaryPosterUrl } from "src/utils/cloudinary";

interface Props {
  video: {
    id: string;
    title: string;
    videoUrl: string;
  };
}

export default function VideoSmall({ video }: Props) {
  const poster = getCloudinaryPosterUrl(video?.videoUrl);

  return (
    <Link className="block" href={`/video/${video.id}`}>
      <div className="relative">
        <div className="aspect-[9/16] overflow-hidden">
          <LazyLoadImage src={poster} className="aspect-[9/16]" effect="opacity" />
        </div>
        <h3 className="line-clamp-1 absolute bottom-0 left-0 right-0 m-2 mt-2 text-sm font-normal drop-shadow-xl">
          {video?.title}
        </h3>
      </div>
    </Link>
  );
}
