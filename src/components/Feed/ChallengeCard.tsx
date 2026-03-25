import Link from "next/link";
import Avatar from "src/components/Avatar";
import { calculateCreatedTime } from "src/utils";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFeed"]["items"][number];
type FeedChallengeItem = Extract<FeedItem, { type: "challenge" }>;

interface Props {
  challenge: FeedChallengeItem["data"];
}

function statusColor(status: string) {
  switch (status) {
    case "OPEN":      return "bg-green-500/15 text-green-400";
    case "ACTIVE":    return "bg-blue-500/15 text-blue-400";
    case "COMPLETED": return "bg-purple-500/15 text-purple-400";
    case "CANCELLED": return "bg-gray-500/15 text-gray-400";
    default:          return "bg-gray-500/15 text-gray-400";
  }
}

export default function ChallengeCard({ challenge }: Props) {
  const participantCount = challenge.participants.length;

  return (
    <Link
      href={`/challenge/${challenge.id}`}
      className="block w-full border-b border-[#1e1e1e] px-4 py-4 transition-colors active:bg-white/[0.03]"
    >
      {/* Header row: type label + status + time */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Challenge</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor(challenge.status)}`}>
          {challenge.status}
        </span>
        <span className="ml-auto text-[11px] text-gray-600">{calculateCreatedTime(challenge.createdAt)}</span>
      </div>

      {/* Title */}
      <h3 className="mb-1 text-[15px] font-bold leading-snug">{challenge.title}</h3>
      {challenge.description && (
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-500">{challenge.description}</p>
      )}

      {/* Creator row */}
      <div className="mb-3 flex items-center gap-2">
        <Avatar src={challenge.creator.image} className="h-6 w-6 rounded-full" />
        <span className="text-sm text-gray-400">{challenge.creator.name ?? "Unknown"}</span>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-400">
          {participantCount} {participantCount === 1 ? "participant" : "participants"}
        </span>
        {challenge._count.submissions > 0 && (
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-400">
            {challenge._count.submissions} submissions
          </span>
        )}
        {challenge.wagerAmount > 0 && (
          <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold text-yellow-400">
            {challenge.wagerAmount.toLocaleString()} pts buy-in
          </span>
        )}
        {challenge.endsAt && (
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-400">
            Ends {new Date(challenge.endsAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
}
