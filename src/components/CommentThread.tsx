import { useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import toast from "react-hot-toast";
import { calculateCreatedTime } from "src/utils";

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface CommentData {
  id: string;
  content: string;
  createdAt: Date | string;
  user: CommentUser;
  replies: Array<{
    id: string;
    content: string;
    createdAt: Date | string;
    user: CommentUser;
  }>;
}

interface Props {
  comments: CommentData[];
  isLoading: boolean;
  currentUserId: string | null;
  onAdd: (content: string, parentId?: string | null) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

function Avatar({ src, size = 8 }: { src?: string | null; size?: number }) {
  return (
    <LazyLoadImage
      src={src ?? undefined}
      className={`h-${size} w-${size} flex-shrink-0 rounded-full object-cover`}
      effect="opacity"
    />
  );
}

function ReplyComposer({
  parentId,
  onSubmit,
  onCancel,
  currentUserImage,
}: {
  parentId: string;
  onSubmit: (content: string, parentId: string) => Promise<void>;
  onCancel: () => void;
  currentUserImage?: string | null;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim(), parentId);
      setText("");
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
      <Avatar src={currentUserImage} size={6} />
      <div className="flex-1">
        <textarea
          ref={ref}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Write a reply..."
          className="w-full resize-none rounded-xl border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
        <div className="mt-1.5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Reply"}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onAdd,
  onDelete,
  currentUserImage,
}: {
  comment: CommentData;
  currentUserId: string | null;
  onAdd: (content: string, parentId?: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  currentUserImage?: string | null;
}) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const isOwn = currentUserId === comment.user.id;

  return (
    <div className="flex gap-3">
      <Link href={`/account/${comment.user.id}`} className="flex-shrink-0">
        <Avatar src={comment.user.image} size={8} />
      </Link>
      <div className="min-w-0 flex-1">
        {/* Bubble */}
        <div className="rounded-2xl bg-[#1f1f1f] px-4 py-3">
          <div className="mb-1 flex items-center gap-2">
            <Link href={`/account/${comment.user.id}`} className="text-sm font-semibold hover:underline">
              {comment.user.name ?? "Unknown"}
            </Link>
            <span className="text-xs text-gray-500">{calculateCreatedTime(comment.createdAt)}</span>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm text-gray-200">{comment.content}</p>
        </div>

        {/* Actions */}
        <div className="mt-1 flex items-center gap-4 px-2">
          {currentUserId && (
            <button
              onClick={() => setReplying((p) => !p)}
              className="text-xs font-semibold text-gray-500 hover:text-white"
            >
              Reply
            </button>
          )}
          {comment.replies.length > 0 && (
            <button
              onClick={() => setShowReplies((p) => !p)}
              className="text-xs text-gray-500 hover:text-white"
            >
              {showReplies ? "Hide" : `Show ${comment.replies.length}`} repl{comment.replies.length === 1 ? "y" : "ies"}
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-auto text-xs text-gray-600 hover:text-red-400"
            >
              Delete
            </button>
          )}
        </div>

        {/* Reply composer */}
        {replying && (
          <ReplyComposer
            parentId={comment.id}
            onSubmit={onAdd}
            onCancel={() => setReplying(false)}
            currentUserImage={currentUserImage}
          />
        )}

        {/* Replies */}
        {showReplies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l-2 border-[#2f2f2f] pl-4">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <Link href={`/account/${reply.user.id}`} className="flex-shrink-0">
                  <Avatar src={reply.user.image} size={7} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl bg-[#1a1a1a] px-3 py-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Link href={`/account/${reply.user.id}`} className="text-xs font-semibold hover:underline">
                        {reply.user.name ?? "Unknown"}
                      </Link>
                      <span className="text-[10px] text-gray-500">{calculateCreatedTime(reply.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-gray-200">{reply.content}</p>
                  </div>
                  {currentUserId === reply.user.id && (
                    <div className="mt-1 px-2">
                      <button
                        onClick={() => onDelete(reply.id)}
                        className="text-xs text-gray-600 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentThread({ comments, isLoading, currentUserId, onAdd, onDelete }: Props) {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(text.trim(), null);
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 border-t border-[#2f2f2f] pt-6">
      <h3 className="mb-5 text-sm font-semibold text-gray-400">
        {isLoading ? "Loading comments..." : `${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
      </h3>

      {/* Top-level composer */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
          <Avatar src={session?.user?.image} size={9} />
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Add a comment..."
              className="w-full resize-none rounded-2xl border border-[#3f3f3f] bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
            {text.trim() && (
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Comment"}
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="mb-5 text-sm text-gray-500">
          <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link> to comment.
        </p>
      )}

      {/* Comment list */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-[#2f2f2f]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/4 animate-pulse rounded bg-[#2f2f2f]" />
                <div className="h-12 animate-pulse rounded-2xl bg-[#2f2f2f]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="py-4 text-sm text-gray-500">No comments yet. Be the first!</p>
      )}

      <div className="flex flex-col gap-5">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onAdd={onAdd}
            onDelete={onDelete}
            currentUserImage={session?.user?.image}
          />
        ))}
      </div>
    </div>
  );
}
