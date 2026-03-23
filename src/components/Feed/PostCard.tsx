import { useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "src/components/Avatar";
import toast from "react-hot-toast";
import { calculateCreatedTime, getUsername } from "src/utils";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFeed"]["items"][number];
type FeedPostItem = Extract<FeedItem, { type: "post" }>;
type PostComment = RouterOutputs["post"]["getPostComments"]["comments"][number];

interface Props {
  post: FeedPostItem["data"];
}

export default function PostCard({ post }: Props) {
  const { data: session } = useSession();
  const [isLike, setIsLike] = useState(post.isLike);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState<PostComment[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const author = post.author;
  const displayName = author.name ?? "Unknown";

  const { data: commentsData, isLoading: commentsLoading } =
    trpc.post.getPostComments.useQuery(
      { postId: post.id },
      { enabled: showComments, staleTime: 30_000 }
    );

  const comments = commentsData?.comments ?? localComments;

  const { mutate: toggleLike } = trpc.post.likePost.useMutation({
    onError: () => {
      toast.error("Something went wrong");
      setIsLike((prev: boolean) => !prev);
      setLikeCount((prev: number) => (isLike ? prev + 1 : prev - 1));
    },
  });

  const { mutate: submitComment, isLoading: isCommenting } =
    trpc.post.commentOnPost.useMutation({
      onSuccess: ({ comment }) => {
        setLocalComments((prev) => [...(commentsData?.comments ?? prev), comment]);
        setCommentCount((prev: number) => prev + 1);
        setNewComment("");
      },
      onError: () => toast.error("Could not post comment"),
    });

  function handleLike() {
    if (!session?.user) { toast.error("Sign in to like posts"); return; }
    setIsLike((prev: boolean) => !prev);
    setLikeCount((prev: number) => (isLike ? prev - 1 : prev + 1));
    toggleLike({ postId: post.id });
  }

  function handleToggleComments() {
    setShowComments((prev) => !prev);
    if (!showComments) setTimeout(() => inputRef.current?.focus(), 150);
  }

  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) { toast.error("Sign in to comment"); return; }
    if (!newComment.trim()) return;
    submitComment({ postId: post.id, content: newComment.trim() });
  }

  return (
    <div className="w-full border-b border-[#2f2f2f] py-5 pr-2">
      <div className="flex w-full items-start">
        {/* Avatar */}
        <Link href={`/account/${author.id}`} className="hidden h-[56px] w-[56px] flex-shrink-0 lg:block">
          <Avatar src={author.image} className="h-[56px] w-[56px] rounded-full" />
        </Link>

        <div className="mx-3 flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-start justify-between">
            <Link href={`/account/${author.id}`} className="flex items-center">
              <div className="mr-3 block h-[56px] w-[56px] flex-shrink-0 lg:hidden">
                <Avatar src={author.image} className="h-[56px] w-[56px] rounded-full" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <h3 className="line-clamp-1 text-[16px] font-bold hover:underline">
                  @{getUsername(displayName)}
                </h3>
                <p className="line-clamp-1 text-sm text-[rgba(255,255,255,0.75)] hover:underline md:ml-2">
                  {displayName}
                </p>
              </div>
            </Link>
            <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
              {calculateCreatedTime(post.createdAt)}
            </span>
          </div>

          {/* Content */}
          {post.title && <p className="mt-2 font-semibold">{post.title}</p>}
          {post.content && (
            <p className="mt-1 text-sm text-[rgba(255,255,255,0.85)] whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {/* Attached image */}
          {post.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#2f2f2f]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt=""
                className="max-h-[500px] w-full object-contain bg-black"
              />
            </div>
          )}

          {/* Attached video */}
          {post.video && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#2f2f2f]">
              <video
                src={post.video.videoUrl}
                controls
                muted
                className="max-h-[400px] w-full object-contain bg-black"
              />
            </div>
          )}

          {/* Action bar */}
          <div className="mt-3 flex items-center gap-5">
            {/* Like */}
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-primary"
            >
              {isLike ? (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              )}
              <span className={isLike ? "text-primary" : ""}>{likeCount}</span>
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{commentCount}</span>
            </button>
          </div>

          {/* Inline comment thread */}
          {showComments && (
            <div className="mt-4 border-t border-[#2f2f2f] pt-4">
              {commentsLoading && (
                <p className="py-2 text-xs text-gray-500">Loading comments...</p>
              )}
              {!commentsLoading && comments.length === 0 && (
                <p className="py-2 text-xs text-gray-500">No comments yet. Be the first.</p>
              )}
              <div className="mb-4 flex flex-col gap-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <Link href={`/account/${c.user.id}`} className="flex-shrink-0">
                      <Avatar src={c.user.image} className="h-7 w-7 rounded-full" />
                    </Link>
                    <div className="min-w-0 rounded-xl bg-[#1a1a1a] px-3 py-2">
                      <p className="text-xs font-semibold text-gray-300">
                        {c.user.name ?? "Unknown"}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-200 break-words">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                {session?.user?.image && (
                  <Avatar src={session.user.image} className="h-7 w-7 flex-shrink-0 rounded-full" />
                )}
                <input
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={session?.user ? "Add a comment..." : "Sign in to comment"}
                  disabled={!session?.user || isCommenting}
                  maxLength={1000}
                  className="flex-1 rounded-full border border-[#3f3f3f] bg-[#1a1a1a] px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none disabled:opacity-50"
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={isCommenting}
                    className="flex-shrink-0 text-sm font-semibold text-primary hover:text-white disabled:opacity-50"
                  >
                    Post
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
