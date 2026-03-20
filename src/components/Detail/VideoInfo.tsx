import Tippy from "@tippyjs/react/headless";
import Link from "next/link";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { LazyLoadImage } from "react-lazy-load-image-component";
import MusicNote from "src/icons/MusicNote";
import { Account, Video } from "src/types";
import AccountPreview from "../Sidebar/AccountPreview";
import { copyToClipboard, getUsername, providers } from "src/utils";
import { useRouter } from "next/router";

interface Props {
  video: Video<Account>;
}

export default function VideoInfo({ video }: Props) {
  const { asPath } = useRouter();
  const copyLink = useMemo(() => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "";
    return `${origin}${asPath}`;
  }, [asPath]);

  return (
    <div className="relative w-full border-l border-[#2f2f2f] lg:w-[544px] lg:overflow-y-hidden">
      <div className="px-4 pb-5 pt-4 lg:px-5 lg:pt-[54px]">
        <div className="flex items-center justify-between">
          <Tippy
            delay={300}
            interactive
            render={() => <AccountPreview account={video?.user} />}
          >
            <Link
              href={`/account/${video?.userId}`}
              className="flex cursor-pointer items-center"
            >
              <div className="h-[40px] w-[40px]">
                <LazyLoadImage
                  src={video?.user.image}
                  effect="opacity"
                  className="rounded-full"
                />
              </div>
              <div className="ml-3">
                <h1 className="line-clamp-1 text-[16px] font-semibold hover:underline">
                  {video?.user.name}
                </h1>
                <p className="line-clamp-1 text-sm font-normal hover:underline">
                  @{getUsername(video?.user?.name)}
                </p>
              </div>
            </Link>
          </Tippy>
        </div>

        <div className="mt-4">
          <p className="line-clamp-2 mt-2 text-sm font-normal">{video?.title}</p>
          <p className="mt-2 flex items-center text-sm font-semibold">
            <MusicNote />{" "}
            <span className="line-clamp-1">Soundtrack {video?.user?.name}</span>
          </p>
        </div>

        <div className="mt-5">
          <div className="flex items-center rounded-sm bg-[#2f2f2f] px-3 py-2">
            <input
              value={copyLink}
              readOnly
              className="line-clamp-1 mr-4 flex-1 bg-transparent text-sm font-normal"
            />
            <button
              onClick={() =>
                copyToClipboard(copyLink)?.then(() =>
                  toast.success("Copy Success")
                ).catch(() => toast.error("Copy Failed"))
              }
              className="text-sm font-semibold"
            >
              Copy link
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {providers.map((item) => (
              <Link
                key={item.name}
                href={item.link(copyLink, video?.title)}
                target="_blank"
                className="h-7 w-7 cursor-pointer"
              >
                <LazyLoadImage
                  effect="opacity"
                  className="rounded-full"
                  src={item?.icon}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
