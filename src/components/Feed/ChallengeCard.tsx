import Link from "next/link";
import Avatar from "src/components/Avatar";
import { calculateCreatedTime } from "src/utils";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFeed"]["items"][number];
type FeedChallengeItem = Extract<FeedItem, { type: "challenge" }>;

interface Props {
  challenge: FeedChallengeItem["data"];
}

function visibilityBadge(visibility: string) {
  switch (visibility) {
    case "PUBLIC":   return { label: "Public",   cls: "bg-green-500/20 text-green-400" };
    case "UNLISTED": return { label: "Unlisted", cls: "bg-gray-500/20 text-gray-400" };
    case "PRIVATE":  return { label: "Private",  cls: "bg-orange-500/20 text-orange-400" };
    default:         return { label: visibility,  cls: "bg-gray-500/20 text-gray-400" };
  }
}

function statusColor(status: string) {
  switch (status) {
    case "OPEN":      return "bg-green-500/20 text-green-400";
    case "ACTIVE":    return "bg-blue-500/20 text-blue-400";
    case "COMPLETED": return "bg-purple-500/20 text-purple-400";
    case "CANCELLED": return "bg-gray-500/20 text-gray-400";
    default:          return "bg-gray-500/20 text-gray-400";
  }
}

export default function ChallengeCard({ challenge }: Props) {
  return (
    <Link
      href={`/challenge/${challenge.id}`}
      className="block w-full border-b border-[#2f2f2f] py-5 pr-2 transition-colors hover:bg-white/[0.02]"
    >
      {/* Label row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-500">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wide">Challenge</span>
        </div>
        <div className="flex items-center gap-2">
          {(() => { const v = visibilityBadge(challenge.visibility); return (
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${v.cls}`}>{v.label}</span>
          ); })()}
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusColor(challenge.status)}`}>
            {challenge.status}
          </span>
          <span className="text-xs text-gray-500">{calculateCreatedTime(challenge.createdAt)}</span>
        </div>
      </div>

      {/* Title + description */}
      <h3 className="mb-1 text-[16px] font-bold leading-snug">{challenge.title}</h3>
      {challenge.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-400">{challenge.description}</p>
      )}

      {/* Creator + stats */}
      <div className="flex items-center gap-2">
        <Avatar src={challenge.creator.image} className="h-6 w-6 rounded-full" />
        <span className="text-sm text-gray-300">{challenge.creator.name ?? "Unknown"}</span>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span>{challenge.participants.length} participants</span>
          {challenge._count.submissions > 0 && (
            <span>{challenge._count.submissions} submissions</span>
          )}
          {challenge.wagerAmount > 0 && (
            <span className="font-semibold text-yellow-400">{challenge.wagerAmount.toLocaleString()} pts</span>
          )}
        </div>
      </div>

      {(challenge.startsAt || challenge.endsAt) && (
        <div className="mt-2 flex gap-3 text-xs text-gray-500">
          {challenge.startsAt && (
            <span>Starts {new Date(challenge.startsAt).toLocaleDateString()}</span>
          )}
          {challenge.endsAt && (
            <span>Ends {new Date(challenge.endsAt).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </Link>
  );
}
