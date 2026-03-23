import Link from "next/link";
import Avatar from "src/components/Avatar";
import { calculateCreatedTime } from "src/utils";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFeed"]["items"][number];
type FeedBetItem = Extract<FeedItem, { type: "bet" }>;

interface Props {
  bet: FeedBetItem["data"];
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
    case "PENDING":  return "bg-yellow-500/20 text-yellow-400";
    case "ACTIVE":   return "bg-green-500/20 text-green-400";
    case "SETTLED":  return "bg-blue-500/20 text-blue-400";
    case "DECLINED": return "bg-red-500/20 text-red-400";
    default:         return "bg-gray-500/20 text-gray-400";
  }
}

export default function BetCard({ bet }: Props) {
  return (
    <Link
      href={`/bet/${bet.id}`}
      className="block w-full border-b border-[#2f2f2f] py-5 pr-2 transition-colors hover:bg-white/[0.02]"
    >
      {/* Label row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-500">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wide">Bet</span>
        </div>
        <div className="flex items-center gap-2">
          {(() => { const v = visibilityBadge(bet.visibility); return (
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${v.cls}`}>{v.label}</span>
          ); })()}
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusColor(bet.status)}`}>
            {bet.status}
          </span>
          <span className="text-xs text-gray-500">{calculateCreatedTime(bet.createdAt)}</span>
        </div>
      </div>

      {/* Title + description */}
      <h3 className="mb-1 text-[16px] font-bold leading-snug">{bet.title}</h3>
      {bet.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-400">{bet.description}</p>
      )}

      {/* Participants */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Avatar src={bet.creator.image} className="h-7 w-7 rounded-full" />
          <span className="text-sm font-semibold">{bet.creator.name ?? "Unknown"}</span>
        </div>
        <span className="text-xs font-bold text-primary">VS</span>
        <div className="flex items-center gap-1.5">
          <Avatar src={bet.opponent.image} className="h-7 w-7 rounded-full"
          />
          <span className="text-sm font-semibold">{bet.opponent.name ?? "Unknown"}</span>
        </div>
        {bet.wagerAmount > 0 && (
          <span className="ml-auto text-xs font-semibold text-yellow-400">
            {bet.wagerAmount} pts each
          </span>
        )}
      </div>

      {bet.status === "SETTLED" && bet.winner && (
        <p className="mt-2 text-xs font-semibold text-green-400">
          Winner: {bet.winner.name ?? "Unknown"}
        </p>
      )}
    </Link>
  );
}
