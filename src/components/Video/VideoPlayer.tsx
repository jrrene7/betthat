import Link from "next/link";
import HeartRed from "src/icons/HeartRed";
import Message from "src/icons/Message";

interface Props {}

export default function VideoPlayer({}: Props) {
  const isFlipped = false;

  return (
    <div className="relative flex items-end">
      <Link
        href={`/video/id`}
        className={`mt-3 ${
          isFlipped
            ? "aspect-[9/16] w-[200px] md:w-[289px]"
            : "aspect-auto md:flex-1"
        } relative max-w-full overflow-hidden rounded-md bg-[#222]`}
      >
        <video loop className="h-full w-full rounded-md" />
        {/* <div className="absolute inset-0 flex items-center justify-center">
            <Spin />
          </div> */}
        {/* <Controls /> */}
      </Link>

      <div className="ml-2 pr-2 md:ml-5">
        <div className="mb-2 flex flex-col items-center">
          <div className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#2f2f2f] md:h-12 md:w-12">
            <HeartRed />
          </div>
          <p className="mt-2 text-[12px] font-normal text-[#fffffb]">likes</p>
        </div>
        <Link href={``}>
          <div className="flex flex-col items-center">
            <div className="flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full bg-[#2f2f2f] md:h-12 md:w-12">
              <Message />
            </div>
            <p className="mt-2 text-[12px] font-normal text-[#fffffb]">
              commentCount
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
