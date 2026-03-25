import { useState } from "react";
import Link from "next/link";
import Avatar from "src/components/Avatar";
import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type LeaderboardUser = RouterOutputs["user"]["getLeaderboard"]["users"][number];
type SortBy = "wins" | "balance";

const MEDALS = ["🥇", "🥈", "🥉"];

function rankColor(rank: number) {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-gray-500";
}

function UserRow({ user, sortBy }: { user: LeaderboardUser; sortBy: SortBy }) {
  return (
    <Link href={`/account/${user.id}`}>
      <div className="flex items-center gap-4 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 transition-colors hover:border-[#3f3f3f] hover:bg-[#222]">
        <span className={`w-7 text-center text-lg font-bold ${rankColor(user.rank)}`}>
          {user.rank <= 3 ? MEDALS[user.rank - 1] : user.rank}
        </span>
        <Avatar src={user.image} className="h-10 w-10 flex-shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{user.name ?? "Unknown"}</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {sortBy === "wins" && user.wins !== null && (
            <p className="text-sm font-bold text-primary">
              {user.wins}W
            </p>
          )}
          <p className={`text-xs font-semibold ${sortBy === "balance" ? "text-yellow-400 text-sm" : "text-gray-400"}`}>
            {user.balance.toLocaleString()} pts
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortBy>("wins");
  const { data, isLoading } = trpc.user.getLeaderboard.useQuery({ by: sortBy, limit: 50 });

  return (
    <AppLayout>
      <Sidebar />
      <div className="flex-1 lg:ml-[348px] lg:mt-5">
        <div className="mx-auto max-w-xl px-4 pb-10 md:px-5">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>

          {/* Toggle */}
          <div className="mb-6 flex rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-1">
            {(["wins", "balance"] as SortBy[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSortBy(tab)}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                  sortBy === tab
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab === "wins" ? "Most Wins" : "Most Points"}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-[60px] animate-pulse rounded-lg bg-[#1a1a1a]" />
              ))}
            </div>
          )}

          {!isLoading && (data?.users.length ?? 0) === 0 && (
            <p className="py-12 text-center text-sm text-gray-500">
              {sortBy === "wins"
                ? "No wins recorded yet. Settle some bets!"
                : "No users yet."}
            </p>
          )}

          {!isLoading && (
            <div className="flex flex-col gap-2">
              {data?.users.map((user) => (
                <UserRow key={user.id} user={user} sortBy={sortBy} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
