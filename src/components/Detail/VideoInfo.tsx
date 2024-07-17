import Tippy from "@tippyjs/react/headless";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { LazyLoadImage } from "react-lazy-load-image-component";
import CommentItem from "src/components/Detail/CommentItem";
import InputComment from "src/components/Detail/InputComment";
import HeartRed from "src/icons/HeartRed";
import Message from "src/icons/Message";
import MusicNote from "src/icons/MusicNote";
import { Account, Comment, Video } from "src/types";
import { trpc } from "src/utils/trpc";
import AccountPreview from "../Sidebar/AccountPreview";
import { copyToClipboard, getUsername, providers } from "src/utils";
import HeartWhite from "src/icons/HeartWhite";
import { useRouter } from "next/router";

interface Props {
  video: Video<Account>;
}

export default function VideoInfo({ video }: Props) {
  const [isFollow, setIsFollow] = useState(video?.isFollow);
  const [isLike, setIsLike] = useState(video?.isLike);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [commentCount, setCommentCount] = useState(video?._count.comment);
  const [comment, setComment] = useState<Comment[]>(video?.comment || []);
  const [likeCount, setLikeCount] = useState(video?._count.likes);
  const { data } = useSession();
  const isOwnVideo = video?.user?.id === data?.user?.id;
  const { asPath } = useRouter();
  const copyLink = useMemo(() => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "";
    return `${origin}${asPath}`;
  }, [asPath]);
  const { mutateAsync: toggleLikeMutation } = trpc.like.likeVideo.useMutation({
    onError: () => {
      toast.error("Something went wrong");
      setIsLike((prev) => !prev);
    },
  });
  const { mutateAsync: toggleFollowMutation } =
    trpc.follow.followUser.useMutation({
      onError: () => {
        toast.error("Something went wrong");
        setIsFollow((prev) => !prev);
      },
    });
  function toggleLike() {
    if (!data?.user) {
      toast.error("You must be logged in!");
      return;
    }
    if (isOwnVideo) return;
    toggleLikeMutation({ videoId: video?.id });
    setIsLike((prev) => !prev);
    if (isLike) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
  }

  function toggleFollow() {
    if (!data?.user) {
      toast.error("You must be logged in!");
      return;
    }
    if (isOwnVideo) return;
    toggleFollowMutation({ followingId: video?.userId });
    setIsFollow((prev) => !prev);
  }

  function addNewComment(comment: Comment) {
    setComment((prev) => [...prev, comment]);
    setCommentCount((prev) => prev + 1);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

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
          {!isOwnVideo && (
            <button
              onClick={toggleFollow}
              className={`rounded-[4px] ${
                isFollow
                  ? "bg-[#2f2f2f] text-white"
                  : "border border-primary text-primary"
              } px-6 py-1.5 text-sm font-semibold`}
            >
              {isFollow ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <div className="mt-4">
          <p className="line-clamp-2 mt-2 text-sm font-normal">
            {video?.title}
          </p>
          <p className="mt-2 flex items-center text-sm font-semibold">
            <MusicNote />{" "}
            <span className="line-clamp-1">Soundtrack {video?.user?.name}</span>
          </p>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center">
            <div onClick={toggleLike} className="mr-4 flex items-center">
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#2f2f2f]">
                {isLike ? <HeartRed small /> : <HeartWhite small />}
              </div>
              <p className="ml-2 text-[12px] font-normal text-[#fffffb]">
                {likeCount}
              </p>
            </div>
            <div className="flex items-center">
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#2f2f2f]">
                <Message small />
              </div>
              <p className="ml-2 text-[12px] font-normal text-[#fffffb]">
                {commentCount}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            {providers.map((item) => (
              <Link
                key={item.name}
                href={item.link(copyLink, video?.title)}
                target="_blank"
                className="mr-2 h-7 w-7 cursor-pointer last:mr-0"
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

        <div className="mt-5 flex items-center rounded-sm bg-[#2f2f2f] px-3 py-2">
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
      </div>

      <div className="h-[calc(100vh-290px)] overflow-y-scroll border-t border-[#2f2f2f] pb-[61px]">
        {comment?.length === 0 && (
          <p className="flex h-full w-full items-center justify-center text-sm font-semibold">
            No comments yet
          </p>
        )}
        {comment?.map((item) => (
          <CommentItem key={item.id} comment={item} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
