import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Comment } from "src/types";
import { calculateCreatedTime } from "src/utils";

interface Props {
  comment: Comment;
}

export default function CommentItem({ comment }: Props) {
  return (
    <div className="border-b border-[#2f2f2f] py-3">
      <div className="flex items-center px-4 lg:px-5">
        <Link href={`/account/${comment.user.id}`} className="block h-10 w-10">
          <LazyLoadImage
            src={comment.user.image}
            className="rounded-full"
            effect="opacity"
          />
        </Link>
        <div className="ml-3 flex-1">
          <h3 className="text-[15px] font-semibold hover:underline">
            <Link href={`/account/${comment.user.id}`}>
              {comment?.user.name}
            </Link>
          </h3>
          <p className="text-sm font-normal">{comment?.comment}</p>
          <div className="mt-[6px] flex items-center">
            <p className="text-[13px] font-normal text-gray-300">
              {calculateCreatedTime(comment.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
