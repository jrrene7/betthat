import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import SubmissionForm from "src/components/Submission/SubmissionForm";
import CommentThread from "src/components/CommentThread";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";
import { calculateCreatedTime } from "src/utils";

function isVideoUrl(url: string) {
  return url.includes("/video/upload/") || /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
}

type Bet = RouterOutputs["bet"]["getBet"]["bet"];

function voteCount(votes: Bet["votes"], userId: string) {
  return votes.filter((v) => v.votedForId === userId).length;
}

const STATUS_STEPS = ["PENDING", "ACTIVE", "SETTLED"] as const;

const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  UNLISTED: "Unlisted",
  PRIVATE: "Private",
};

function statusColor(status: string) {
  switch (status) {
    case "PENDING":   return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "ACTIVE":    return "bg-green-500/20 text-green-400 border-green-500/30";
    case "SETTLED":   return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "DECLINED":  return "bg-red-500/20 text-red-400 border-red-500/30";
    case "CANCELLED": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:          return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function UserChip({ user, label }: { user: { id: string; name: string | null; image: string | null }; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <Link href={`/account/${user.id}`} className="flex flex-col items-center gap-1 hover:opacity-80">
        <LazyLoadImage src={user.image ?? undefined} className="h-14 w-14 rounded-full" effect="opacity" />
        <p className="text-sm font-semibold">{user.name ?? "Unknown"}</p>
      </Link>
    </div>
  );
}

function toDatetimeLocal(val: Date | string | null | undefined) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function wasUpdated(createdAt: Date | string, updatedAt: Date | string) {
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 5000;
}

function BetDetail({ bet, currentUserId }: { bet: Bet; currentUserId: string | null }) {
  const utils = trpc.useContext();
  const isParticipant = !!currentUserId && (bet.creatorId === currentUserId || bet.opponentId === currentUserId);
  const isCreator = currentUserId === bet.creatorId;
  const isOpponent = currentUserId === bet.opponentId;
  const isTerminal = ["DECLINED", "CANCELLED", "SETTLED"].includes(bet.status);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(bet.title);
  const [editDescription, setEditDescription] = useState(bet.description ?? "");
  const [editDueAt, setEditDueAt] = useState(toDatetimeLocal(bet.dueAt));
  const acceptMutation = trpc.bet.acceptBet.useMutation({
    onSuccess: () => { toast.success("Bet accepted!"); utils.bet.getBet.invalidate(); utils.bet.getInbox.invalidate(); },
    onError: () => toast.error("Could not accept bet"),
  });
  const declineMutation = trpc.bet.declineBet.useMutation({
    onSuccess: () => { toast.success("Bet declined."); utils.bet.getBet.invalidate(); utils.bet.getInbox.invalidate(); },
    onError: () => toast.error("Could not decline bet"),
  });
  const settleMutation = trpc.bet.castSettleVote.useMutation({
    onSuccess: (data) => {
      if (data.state === "settled") toast.success("Both agreed — bet settled!");
      else if (data.state === "disputed") toast("Votes disagree — community will decide!", { icon: "⚡" });
      else toast.success("Vote cast — waiting for opponent");
      utils.bet.getBet.invalidate();
    },
    onError: (e) => toast.error(e.message || "Could not cast vote"),
  });

  const resolveDisputeMutation = trpc.bet.resolveDispute.useMutation({
    onSuccess: (data) => {
      if (data.outcome === "tied") toast.success("Tied — both refunded!");
      else toast.success("Dispute resolved by community vote!");
      utils.bet.getBet.invalidate();
    },
    onError: (e) => toast.error(e.message || "Could not resolve"),
  });
  const visibilityMutation = trpc.bet.updateVisibility.useMutation({
    onSuccess: () => { toast.success("Visibility updated"); utils.bet.getBet.invalidate(); },
    onError: () => toast.error("Could not update visibility"),
  });
  const updateMutation = trpc.bet.updateBet.useMutation({
    onSuccess: () => {
      toast.success("Bet updated!");
      setIsEditing(false);
      utils.bet.getBet.invalidate();
    },
    onError: (e) => toast.error(e.message || "Could not update bet"),
  });

  const voteMutation = trpc.bet.castBetVote.useMutation({
    onSuccess: () => { utils.bet.getBet.invalidate(); },
    onError: () => toast.error("Could not cast vote"),
  });

  const { data: commentsData, isLoading: commentsLoading } = trpc.bet.getComments.useQuery({ betId: bet.id });
  const addCommentMutation = trpc.bet.addComment.useMutation({
    onSuccess: () => utils.bet.getComments.invalidate({ betId: bet.id }),
    onError: (e) => toast.error(e.message || "Could not post comment"),
  });
  const deleteCommentMutation = trpc.bet.deleteComment.useMutation({
    onSuccess: () => utils.bet.getComments.invalidate({ betId: bet.id }),
    onError: () => toast.error("Could not delete comment"),
  });

  const { data: submissionsData } = trpc.bet.getBetSubmissions.useQuery({ betId: bet.id });
  const submitMutation = trpc.bet.submitToBet.useMutation({
    onSuccess: () => {
      toast.success("Evidence submitted!");
      utils.bet.getBetSubmissions.invalidate({ betId: bet.id });
    },
    onError: (e) => toast.error(e.message || "Could not submit"),
  });

  const anyLoading = acceptMutation.isLoading || declineMutation.isLoading || settleMutation.isLoading || resolveDisputeMutation.isLoading;

  // Derive my own settle vote from bet data
  const mySettleVote = isCreator ? bet.creatorSettleVote : isOpponent ? bet.opponentSettleVote : null;
  const otherSettleVote = isCreator ? bet.opponentSettleVote : isOpponent ? bet.creatorSettleVote : null;
  const hasVoted = !!mySettleVote;
  const bothVoted = !!bet.creatorSettleVote && !!bet.opponentSettleVote;

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 md:px-5">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bet</h1>
        <span className={`rounded border px-3 py-1 text-sm font-semibold ${statusColor(bet.status)}`}>
          {bet.status}
        </span>
      </div>

      {/* Participants */}
      <div className="mb-6 flex items-center justify-around rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-6">
        <UserChip user={bet.creator} label="Creator" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-2xl font-bold text-primary">VS</p>
          {bet.status === "SETTLED" && bet.winner && (
            <p className="text-xs text-green-400 font-semibold">
              Winner: {bet.winner.name ?? "Unknown"}
            </p>
          )}
        </div>
        <UserChip user={bet.opponent} label="Opponent" />
      </div>

      {/* Bet details */}
      <div className="mb-6 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
        {!isEditing ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold">{bet.title}</h2>
              {isCreator && !isTerminal && (
                <button
                  onClick={() => { setEditTitle(bet.title); setEditDescription(bet.description ?? ""); setEditDueAt(toDatetimeLocal(bet.dueAt)); setIsEditing(true); }}
                  className="flex-shrink-0 rounded p-1 text-gray-500 hover:bg-[#2a2a2a] hover:text-white"
                >
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
              )}
            </div>
            {bet.description && (
              <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{bet.description}</p>
            )}
            {bet.wagerAmount > 0 && (
              <p className="mt-3 text-sm font-semibold text-yellow-400">{bet.wagerAmount} pts wagered each</p>
            )}
            {bet.dueAt && (
              <p className="mt-3 text-xs text-gray-500">Due: {new Date(bet.dueAt).toLocaleString()}</p>
            )}
            {bet.resolvedAt && (
              <p className="mt-1 text-xs text-gray-500">Settled: {new Date(bet.resolvedAt).toLocaleString()}</p>
            )}
            {wasUpdated(bet.createdAt, bet.updatedAt) && (
              <p className="mt-2 text-xs text-gray-600">Last updated {calculateCreatedTime(bet.updatedAt)}</p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={150}
              placeholder="Bet title"
              className="w-full rounded-lg border border-[#3f3f3f] bg-[#121212] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Conditions (optional)"
              className="w-full resize-none rounded-lg border border-[#3f3f3f] bg-[#121212] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
            <div>
              <label className="mb-1 block text-xs text-gray-500">Due date (optional)</label>
              <input
                type="datetime-local"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
                className="w-full rounded-lg border border-[#3f3f3f] bg-[#121212] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-lg border border-[#3f3f3f] py-2 text-sm font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={updateMutation.isLoading || !editTitle.trim()}
                onClick={() => updateMutation.mutate({ betId: bet.id, title: editTitle, description: editDescription || null, dueAt: editDueAt || null })}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
              >
                {updateMutation.isLoading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status timeline */}
      {!["DECLINED", "CANCELLED"].includes(bet.status) && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          {STATUS_STEPS.map((step, i) => {
            const stepIndex = STATUS_STEPS.indexOf(step);
            const currentIndex = STATUS_STEPS.indexOf(bet.status as (typeof STATUS_STEPS)[number]);
            const reached = currentIndex >= stepIndex;
            return (
              <div key={step} className="flex flex-1 flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${reached ? "bg-primary" : "bg-[#2f2f2f]"}`} />
                <p className={`mt-1 text-xs ${reached ? "text-white" : "text-gray-500"}`}>{step}</p>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`absolute hidden md:block h-[2px] w-16 ${reached ? "bg-primary" : "bg-[#2f2f2f]"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Participant actions */}
      {isParticipant && !isTerminal && (
        <div className="mb-6 flex flex-col gap-3">
          {isOpponent && bet.status === "PENDING" && (
            <div className="flex gap-2">
              <button
                disabled={anyLoading}
                onClick={() => declineMutation.mutate({ betId: bet.id })}
                className="flex-1 rounded border border-[rgba(255,255,255,0.2)] bg-transparent py-2 text-sm font-semibold text-white hover:bg-[#2f2f2f] disabled:opacity-50"
              >
                Decline
              </button>
              <button
                disabled={anyLoading}
                onClick={() => acceptMutation.mutate({ betId: bet.id })}
                className="flex-1 rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
              >
                {acceptMutation.isLoading ? "Accepting..." : "Accept Bet"}
              </button>
            </div>
          )}
          {(bet.status === "ACTIVE" || bet.status === "DISPUTED") && (
            <div className="rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
              {bet.status === "DISPUTED" ? (
                <>
                  <p className="mb-1 text-sm font-semibold text-yellow-400">⚡ Disputed</p>
                  <p className="mb-3 text-xs text-gray-400">
                    You disagreed on the result. Community votes will decide — or{" "}
                    <button
                      disabled={resolveDisputeMutation.isLoading}
                      onClick={() => resolveDisputeMutation.mutate({ betId: bet.id })}
                      className="text-primary underline hover:text-white disabled:opacity-50"
                    >
                      resolve now
                    </button>
                    {" "}({bet._count.votes} community vote{bet._count.votes !== 1 ? "s" : ""} cast).
                  </p>
                </>
              ) : hasVoted ? (
                <>
                  <p className="mb-1 text-sm font-semibold">Vote cast</p>
                  <p className="mb-3 text-xs text-gray-400">
                    You voted: <span className="font-semibold text-white">
                      {mySettleVote === bet.creatorId ? bet.creator.name : bet.opponent.name}
                    </span> won. Waiting for opponent to confirm.
                  </p>
                  <p className="text-xs text-gray-500">Change your vote:</p>
                </>
              ) : (
                <p className="mb-3 text-sm font-semibold">Who won?</p>
              )}
              {!bothVoted || bet.status === "DISPUTED" ? null : null}
              <div className="flex gap-2">
                {[
                  { user: bet.creator, label: bet.creator.name ?? "Creator" },
                  { user: bet.opponent, label: bet.opponent.name ?? "Opponent" },
                ].map(({ user, label }) => {
                  const isMyPick = mySettleVote === user.id;
                  return (
                    <button
                      key={user.id}
                      disabled={anyLoading}
                      onClick={() => settleMutation.mutate({ betId: bet.id, winnerId: user.id })}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg border py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
                        isMyPick
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[#3f3f3f] text-gray-300 hover:border-gray-300"
                      }`}
                    >
                      <LazyLoadImage src={user.image ?? undefined} className="h-8 w-8 rounded-full" effect="opacity" />
                      <span>{label}</span>
                      {isMyPick && <span className="text-[10px] text-primary">Your pick</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evidence submissions — participants on active bets */}
      {isParticipant && bet.status === "ACTIVE" && (
        <div className="mb-6 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          <p className="mb-3 text-sm font-semibold">Submit evidence</p>
          <SubmissionForm
            isLoading={submitMutation.isLoading}
            label="Submit Evidence"
            onSubmit={({ content, mediaUrl }) =>
              submitMutation.mutate({ betId: bet.id, content: content || null, mediaUrl })
            }
          />
        </div>
      )}

      {/* Submissions list */}
      {submissionsData && submissionsData.submissions.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-gray-400">
            Evidence ({submissionsData.submissions.length})
          </p>
          <div className="flex flex-col gap-3">
            {submissionsData.submissions.map((sub) => (
              <div key={sub.id} className="rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Link href={`/account/${sub.user.id}`} className="flex items-center gap-2 hover:opacity-80">
                    <LazyLoadImage src={sub.user.image ?? undefined} className="h-7 w-7 rounded-full" effect="opacity" />
                    <span className="text-sm font-semibold">{sub.user.name ?? "Unknown"}</span>
                  </Link>
                  <span className="ml-auto text-xs text-gray-500">{calculateCreatedTime(sub.createdAt)}</span>
                </div>
                {sub.content && (
                  <p className="mb-2 text-sm text-gray-200 whitespace-pre-wrap">{sub.content}</p>
                )}
                {sub.imageUrl && (
                  <div className="overflow-hidden rounded-lg border border-[#2f2f2f]">
                    {isVideoUrl(sub.imageUrl) ? (
                      <video src={sub.imageUrl} controls muted className="max-h-[320px] w-full bg-black object-contain" />
                    ) : (
                      <img src={sub.imageUrl} alt="" className="max-h-[320px] w-full object-contain bg-black" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public voting — non-participants on active/settled bets */}
      {currentUserId && !isParticipant && ["ACTIVE", "SETTLED"].includes(bet.status) && (
        <div className="mb-6 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          <p className="mb-1 text-sm font-semibold">Who do you think wins?</p>
          <p className="mb-3 text-xs text-gray-500">
            {bet._count.votes} vote{bet._count.votes !== 1 ? "s" : ""} cast
          </p>
          <div className="flex gap-2">
            {[
              { user: bet.creator, label: bet.creator.name ?? "Creator" },
              { user: bet.opponent, label: bet.opponent.name ?? "Opponent" },
            ].map(({ user, label }) => {
              const myVote = bet.votes.find((v) => v.voterId === currentUserId);
              const isVoted = myVote?.votedForId === user.id;
              const count = voteCount(bet.votes, user.id);
              return (
                <button
                  key={user.id}
                  disabled={voteMutation.isLoading}
                  onClick={() => voteMutation.mutate({ betId: bet.id, votedForId: user.id })}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg border py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    isVoted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-[#3f3f3f] text-gray-300 hover:border-gray-300"
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-xs font-normal text-gray-500">{count} vote{count !== 1 ? "s" : ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vote summary — participants can see how public votes lean */}
      {isParticipant && bet._count.votes > 0 && (
        <div className="mb-6 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          <p className="mb-3 text-sm font-semibold text-gray-400">
            Public vote <span className="text-gray-600">({bet._count.votes} total)</span>
          </p>
          <div className="flex gap-2 text-sm">
            <div className="flex flex-1 items-center justify-between rounded bg-[#2a2a2a] px-3 py-2">
              <span>{bet.creator.name ?? "Creator"}</span>
              <span className="font-bold text-primary">{voteCount(bet.votes, bet.creatorId)}</span>
            </div>
            <div className="flex flex-1 items-center justify-between rounded bg-[#2a2a2a] px-3 py-2">
              <span>{bet.opponent.name ?? "Opponent"}</span>
              <span className="font-bold text-primary">{voteCount(bet.votes, bet.opponentId)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Visibility control — creator only */}
      {isCreator && (
        <div className="rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          <p className="mb-3 text-sm font-semibold">Visibility</p>
          <div className="flex gap-2">
            {(["PUBLIC", "UNLISTED", "PRIVATE"] as const).map((v) => (
              <button
                key={v}
                disabled={visibilityMutation.isLoading}
                onClick={() => visibilityMutation.mutate({ betId: bet.id, visibility: v })}
                className={`flex-1 rounded border py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  bet.visibility === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[#3f3f3f] text-gray-400 hover:border-gray-300 hover:text-white"
                }`}
              >
                {VISIBILITY_LABELS[v]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {bet.visibility === "PUBLIC" && "Visible to everyone and appears in feeds."}
            {bet.visibility === "UNLISTED" && "Accessible by link but not shown in feeds."}
            {bet.visibility === "PRIVATE" && "Only visible to you and your opponent."}
          </p>
        </div>
      )}

      {/* Comment thread — hidden on private bets */}
      {bet.visibility !== "PRIVATE" && (
        <CommentThread
          comments={commentsData?.comments ?? []}
          isLoading={commentsLoading}
          currentUserId={currentUserId}
          onAdd={async (content, parentId) => {
            await addCommentMutation.mutateAsync({ betId: bet.id, content, parentId });
          }}
          onDelete={async (commentId) => {
            await deleteCommentMutation.mutateAsync({ commentId });
          }}
        />
      )}
    </div>
  );
}

export default function BetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const id = router.query.id as string;

  const { data, isLoading, isError } = trpc.bet.getBet.useQuery(
    { id },
    { enabled: !!id }
  );

  return (
    <AppLayout>
      <Sidebar />
      <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
        {isLoading && (
          <div className="mx-auto max-w-xl px-4 py-8 md:px-5">
            <p className="text-sm text-gray-400">Loading bet...</p>
          </div>
        )}
        {isError && (
          <div className="mx-auto max-w-xl px-4 py-8 md:px-5">
            <p className="text-sm text-red-400">Could not load bet. It may be private.</p>
          </div>
        )}
        {data?.bet && (
          <BetDetail bet={data.bet} currentUserId={session?.user?.id ?? null} />
        )}
      </div>
    </AppLayout>
  );
}
