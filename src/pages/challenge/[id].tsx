import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import SubmissionForm from "src/components/Submission/SubmissionForm";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";
import { calculateCreatedTime } from "src/utils";

function isVideoUrl(url: string) {
  return url.includes("/video/upload/") || /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
}

type Challenge = RouterOutputs["challenge"]["getChallenge"]["challenge"];
type Submission = RouterOutputs["challenge"]["getSubmissions"]["submissions"][number];

const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  UNLISTED: "Unlisted",
  PRIVATE: "Private",
};

function statusColor(status: string) {
  switch (status) {
    case "OPEN":      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "ACTIVE":    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "COMPLETED": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "CANCELLED": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:          return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function SubmissionCard({ submission, currentUserId, challengeId }: {
  submission: Submission;
  currentUserId: string | null;
  challengeId: string;
}) {
  const utils = trpc.useContext();
  const isOwn = currentUserId === submission.userId;
  const myVote = submission.votes.find((v) => v.voterId === currentUserId);
  const approveCount = submission.votes.filter((v) => v.approved).length;
  const rejectCount = submission.votes.filter((v) => !v.approved).length;

  const voteMutation = trpc.challenge.voteOnSubmission.useMutation({
    onSuccess: () => utils.challenge.getSubmissions.invalidate({ challengeId }),
    onError: () => toast.error("Could not cast vote"),
  });

  return (
    <div className="rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
      <div className="mb-3 flex items-center gap-3">
        <Link href={`/account/${submission.user.id}`} className="flex items-center gap-2 hover:opacity-80">
          <LazyLoadImage
            src={submission.user.image ?? undefined}
            className="h-8 w-8 rounded-full"
            effect="opacity"
          />
          <span className="text-sm font-semibold">{submission.user.name ?? "Unknown"}</span>
        </Link>
        <span className="ml-auto text-xs text-gray-500">{calculateCreatedTime(submission.createdAt)}</span>
      </div>

      {submission.content && (
        <p className="mb-3 text-sm text-gray-200 whitespace-pre-wrap">{submission.content}</p>
      )}
      {submission.imageUrl && (
        <div className="mb-3 overflow-hidden rounded-lg border border-[#2f2f2f]">
          {isVideoUrl(submission.imageUrl) ? (
            <video src={submission.imageUrl} controls muted className="max-h-[320px] w-full bg-black object-contain" />
          ) : (
            <img src={submission.imageUrl} alt="" className="max-h-[320px] w-full object-contain bg-black" />
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{submission._count.votes} vote{submission._count.votes !== 1 ? "s" : ""}</span>
        {!isOwn && currentUserId && (
          <div className="ml-auto flex gap-2">
            <button
              disabled={voteMutation.isLoading}
              onClick={() => voteMutation.mutate({ submissionId: submission.id, approved: true })}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                myVote?.approved === true
                  ? "bg-green-500/20 text-green-400"
                  : "bg-[#2a2a2a] text-gray-400 hover:text-green-400"
              }`}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
              {approveCount}
            </button>
            <button
              disabled={voteMutation.isLoading}
              onClick={() => voteMutation.mutate({ submissionId: submission.id, approved: false })}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                myVote?.approved === false
                  ? "bg-red-500/20 text-red-400"
                  : "bg-[#2a2a2a] text-gray-400 hover:text-red-400"
              }`}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
              </svg>
              {rejectCount}
            </button>
          </div>
        )}
        {isOwn && (
          <div className="ml-auto flex gap-3 text-xs text-gray-500">
            <span className="text-green-400">{approveCount} ✓</span>
            <span className="text-red-400">{rejectCount} ✗</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeDetail({ challenge, currentUserId }: { challenge: Challenge; currentUserId: string | null }) {
  const utils = trpc.useContext();
  const isCreator = currentUserId === challenge.creatorId;
  const isParticipant = challenge.participants.some((p) => p.userId === currentUserId);
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([]);

  const { data: suggestionsData } = trpc.follow.getAccountSuggestion.useQuery(undefined, {
    enabled: isCreator,
  });

  const { data: submissionsData } = trpc.challenge.getSubmissions.useQuery(
    { challengeId: challenge.id },
  );

  const inviteMutation = trpc.challenge.inviteParticipants.useMutation({
    onSuccess: ({ added }) => {
      toast.success(added > 0 ? `${added} participant${added > 1 ? "s" : ""} invited!` : "Already in challenge");
      setSelectedInviteIds([]);
      utils.challenge.getChallenge.invalidate();
    },
    onError: () => toast.error("Could not invite participants"),
  });

  const visibilityMutation = trpc.challenge.updateVisibility.useMutation({
    onSuccess: () => { toast.success("Visibility updated"); utils.challenge.getChallenge.invalidate(); },
    onError: () => toast.error("Could not update visibility"),
  });

  const submitMutation = trpc.challenge.submitToChallenge.useMutation({
    onSuccess: () => {
      toast.success("Submission added!");
      utils.challenge.getSubmissions.invalidate({ challengeId: challenge.id });
      utils.challenge.getChallenge.invalidate();
    },
    onError: (e) => toast.error(e.message || "Could not submit"),
  });

  const canSubmit = isParticipant && ["OPEN", "ACTIVE"].includes(challenge.status);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 md:px-5">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Challenge</h1>
        <span className={`rounded border px-3 py-1 text-sm font-semibold ${statusColor(challenge.status)}`}>
          {challenge.status}
        </span>
      </div>

      {/* Creator */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
        <LazyLoadImage
          src={challenge.creator.image ?? undefined}
          className="h-10 w-10 rounded-full"
          effect="opacity"
        />
        <div>
          <p className="text-xs text-gray-500">Created by</p>
          <Link href={`/account/${challenge.creator.id}`} className="font-semibold hover:underline">
            {challenge.creator.name ?? "Unknown"}
          </Link>
        </div>
        <span className="ml-auto text-xs text-gray-500">{calculateCreatedTime(challenge.createdAt)}</span>
      </div>

      {/* Details */}
      <div className="mb-6 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
        <h2 className="text-lg font-bold">{challenge.title}</h2>
        {challenge.description && (
          <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
        )}
        {(challenge.startsAt || challenge.endsAt) && (
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            {challenge.startsAt && <span>Starts: {new Date(challenge.startsAt).toLocaleString()}</span>}
            {challenge.endsAt && <span>Ends: {new Date(challenge.endsAt).toLocaleString()}</span>}
          </div>
        )}
        {challenge.wagerAmount > 0 && (
          <p className="mt-3 text-sm font-semibold text-yellow-400">
            {challenge.wagerAmount.toLocaleString()} pts buy-in · pot: {(challenge.wagerAmount * challenge._count.participants).toLocaleString()} pts
          </p>
        )}
        <div className="mt-3 flex gap-4 text-xs text-gray-500">
          <span>{challenge._count.participants} participants</span>
          <span>{challenge._count.submissions} submissions</span>
          <span>{challenge._count.bets} bets</span>
        </div>
      </div>

      {/* Participants */}
      {challenge.participants.length > 0 && (
        <div className="mb-6 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-400">Participants</h3>
          <div className="flex flex-wrap gap-3">
            {challenge.participants.map((p) => (
              <Link key={p.id} href={`/account/${p.user.id}`} className="flex items-center gap-2 hover:opacity-80">
                <LazyLoadImage
                  src={p.user.image ?? undefined}
                  className="h-8 w-8 rounded-full"
                  effect="opacity"
                />
                <span className="text-sm">
                  {p.user.name ?? "Unknown"}
                  {p.userId === challenge.creatorId && (
                    <span className="ml-1 text-xs text-gray-500">(creator)</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Submit entry — participants only */}
      {canSubmit && (
        <div className="mb-6 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          <p className="mb-3 text-sm font-semibold">Submit your entry</p>
          <SubmissionForm
            isLoading={submitMutation.isLoading}
            onSubmit={({ content, mediaUrl }) =>
              submitMutation.mutate({ challengeId: challenge.id, content: content || null, mediaUrl })
            }
          />
        </div>
      )}

      {/* Submissions list */}
      {submissionsData && submissionsData.submissions.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-400">
            Submissions ({submissionsData.submissions.length})
          </h3>
          <div className="flex flex-col gap-3">
            {submissionsData.submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                currentUserId={currentUserId}
                challengeId={challenge.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Invite participants — creator only */}
      {isCreator && suggestionsData && (
        <div className="mb-6 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          <p className="mb-3 text-sm font-semibold">Invite Participants</p>
          <div className="mb-3 max-h-48 overflow-y-auto flex flex-col gap-2">
            {suggestionsData.accounts
              .filter((u) => !challenge.participants.some((p) => p.userId === u.id))
              .map((user) => {
                const selected = selectedInviteIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() =>
                      setSelectedInviteIds((prev) =>
                        prev.includes(user.id)
                          ? prev.filter((id) => id !== user.id)
                          : [...prev, user.id]
                      )
                    }
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      selected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <LazyLoadImage
                      src={user.image ?? undefined}
                      className="h-8 w-8 flex-shrink-0 rounded-full"
                      effect="opacity"
                    />
                    <span className="flex-1 text-sm font-semibold">{user.name ?? "Unknown"}</span>
                    <div className={`h-4 w-4 flex-shrink-0 rounded border ${
                      selected ? "border-primary bg-primary" : "border-gray-500"
                    }`}>
                      {selected && (
                        <svg viewBox="0 0 24 24" fill="white" className="h-full w-full p-0.5">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            {suggestionsData.accounts.filter((u) => !challenge.participants.some((p) => p.userId === u.id)).length === 0 && (
              <p className="py-2 text-xs text-gray-500">No users to invite.</p>
            )}
          </div>
          {selectedInviteIds.length > 0 && (
            <button
              disabled={inviteMutation.isLoading}
              onClick={() => inviteMutation.mutate({ challengeId: challenge.id, userIds: selectedInviteIds })}
              className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
            >
              {inviteMutation.isLoading ? "Inviting..." : `Invite ${selectedInviteIds.length} participant${selectedInviteIds.length > 1 ? "s" : ""}`}
            </button>
          )}
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
                onClick={() => visibilityMutation.mutate({ challengeId: challenge.id, visibility: v })}
                className={`flex-1 rounded border py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  challenge.visibility === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-[#3f3f3f] text-gray-400 hover:border-gray-300 hover:text-white"
                }`}
              >
                {VISIBILITY_LABELS[v]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {challenge.visibility === "PUBLIC" && "Visible to everyone and appears in feeds."}
            {challenge.visibility === "UNLISTED" && "Accessible by link but not shown in feeds."}
            {challenge.visibility === "PRIVATE" && "Only visible to participants."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ChallengePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const id = router.query.id as string;

  const { data, isLoading, isError } = trpc.challenge.getChallenge.useQuery(
    { id },
    { enabled: !!id }
  );

  return (
    <AppLayout>
      <Sidebar />
      <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
        {isLoading && (
          <div className="mx-auto max-w-xl px-4 py-8 md:px-5">
            <p className="text-sm text-gray-400">Loading challenge...</p>
          </div>
        )}
        {isError && (
          <div className="mx-auto max-w-xl px-4 py-8 md:px-5">
            <p className="text-sm text-red-400">Could not load challenge. It may be private.</p>
          </div>
        )}
        {data?.challenge && (
          <ChallengeDetail
            challenge={data.challenge}
            currentUserId={session?.user?.id ?? null}
          />
        )}
      </div>
    </AppLayout>
  );
}
