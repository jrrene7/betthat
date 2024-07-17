import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { CircularProgress } from "react-cssfx-loading";
import toast from "react-hot-toast";
import { Comment } from "src/types";
import { trpc } from "src/utils/trpc";

interface Props {
  videoId: string;
  addNewComment: (comment: Comment) => void;
}

export default function InputComment({ videoId, addNewComment }: Props) {
  const [comment, setComment] = useState("");
  const { data } = useSession();
  const router = useRouter();
  const { mutateAsync, isLoading } = trpc.comment.createComment.useMutation({
    onSuccess: (response) => {
      const comment = response.comment as unknown as Comment;
      addNewComment(comment);
      setComment("");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  function onCreateComment(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data?.user) return;
    if (!comment?.trim()) return;
    mutateAsync({ comment, videoId });
  }

  return (
    <form
      onSubmit={onCreateComment}
      className="absolute bottom-0 left-0 right-0 flex w-full items-center border-t border-[#2f2f2f] bg-[#111] px-5 py-3"
    >
      {data?.user ? (
        <>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add comment..."
            className="w-full overflow-hidden rounded-md bg-[#2f2f2f] px-4 py-2 text-sm"
          />
          {isLoading ? (
            <CircularProgress className="ml-4" width={30} height={30} />
          ) : (
            <div className="flex items-center">
              <button disabled={isLoading} className="px-4 py-2 text-sm">
                Post
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="px-4 py-2 text-sm font-semibold text-primary">
          Please{" "}
          <Link href={`/sign-in?redirect=${encodeURIComponent(router?.asPath)}`} className="underline">
            log in
          </Link>{" "}
          to comment
        </div>
      )}
    </form>
  );
}
