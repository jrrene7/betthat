import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";

interface Props {}

export default function AccountItem({}: Props) {
  return (
    <Link
      href={``}
      className="flex flex-col items-center rounded-md border border-[#2f2f2f] p-4"
    >
      <div className="h-[60px] w-[60px]">
        <LazyLoadImage className="rounded-full" effect="opacity" />
      </div>
      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <h3 className="line-clamp-1 text-[16px] font-bold hover:underline">
          @username
        </h3>
        <p className="line-clamp-1 text-sm text-[rgba(255,255,255,0.75)] hover:underline">
          name
        </p>
        <p className="line-clamp-1 mt-2 text-sm text-[rgba(255,255,255,0.75)]">
          <span className="font-semibold text-white">0</span> Followers
        </p>
      </div>
    </Link>
  );
}
