import Link from "next/link";
import Avatar from "src/components/Avatar";
import { calculateCreatedTime } from "src/utils";
import { RouterOutputs } from "src/utils/trpc";

type FeedItem = RouterOutputs["feed"]["getFeed"]["items"][number];
type FeedBetItem = Extract<FeedItem, { type: "bet" }>;

interface Props {
  bet: FeedBetItem["data"];
}

function statusColor(status: string) {
  switch (status) {
    case "PENDING":  return "bg-yellow-500/15 text-yellow-400";
    case "ACTIVE":   return "bg-green-500/15 text-green-400";
    case "SETTLED":  return "bg-blue-500/15 text-blue-400";
    case "DECLINED": return "bg-red-500/15 text-red-400";
    default:         return "bg-gray-500/15 text-gray-400";
  }
}

export default function BetCard({ bet }: Props) {
  return (
    <Link
      href={`/bet/${bet.id}`}
      className="block w-full border-b border-[#1e1e1e] px-4 py-4 transition-colors active:bg-white/[0.03]"
    >
      {/* Header row: type label + status + time */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Bet</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor(bet.status)}`}>
          {bet.status}
        </span>
        <span className="ml-auto text-[11px] text-gray-600">{calculateCreatedTime(bet.createdAt)}</span>
      </div>

      {/* Title */}
      <h3 className="mb-3 text-[15px] font-bold leading-snug">{bet.title}</h3>
      {bet.description && (
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-500">{bet.description}</p>
      )}

      {/* VS matchup */}
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar src={bet.creator.image} className="h-8 w-8 flex-shrink-0 rounded-full" />
          <span className="truncate text-sm font-semibold">{bet.creator.name ?? "Unknown"}</span>
        </div>

        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <span className="text-[11px] font-black text-primary">VS</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-semibold">{bet.opponent.name ?? "Unknown"}</span>
          <Avatar src={bet.opponent.image} className="h-8 w-8 flex-shrink-0 rounded-full" />
        </div>
      </div>

      {/* Footer */}
      {(bet.wagerAmount > 0 || (bet.status === "SETTLED" && bet.winner)) && (
        <div className="mt-3 flex items-center gap-3">
          {bet.wagerAmount > 0 && (
            <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-[11px] font-bold text-yellow-400">
              {bet.wagerAmount.toLocaleString()} pts each
            </span>
          )}
          {bet.status === "SETTLED" && bet.winner && (
            <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-bold text-green-400">
              Winner: {bet.winner.name ?? "Unknown"}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
