import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Avatar from "src/components/Avatar";
import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";
import { calculateCreatedTime } from "src/utils";

type SearchResult = RouterOutputs["user"]["search"];
type SearchTab = "accounts" | "bets" | "challenges";

function statusColor(status: string) {
  switch (status) {
    case "PENDING":  return "bg-yellow-500/20 text-yellow-400";
    case "ACTIVE":   return "bg-green-500/20 text-green-400";
    case "SETTLED":  return "bg-blue-500/20 text-blue-400";
    case "DECLINED": return "bg-red-500/20 text-red-400";
    default:         return "bg-gray-500/20 text-gray-400";
  }
}

function challengeStatusColor(status: string) {
  switch (status) {
    case "OPEN":      return "bg-green-500/20 text-green-400";
    case "ACTIVE":    return "bg-blue-500/20 text-blue-400";
    case "COMPLETED": return "bg-purple-500/20 text-purple-400";
    default:          return "bg-gray-500/20 text-gray-400";
  }
}

function EmptyState({ tab, keyword }: { tab: SearchTab; keyword: string }) {
  return (
    <p className="py-12 text-center text-sm text-gray-500">
      No {tab} found for &ldquo;{keyword}&rdquo;
    </p>
  );
}

function AccountResults({ users }: { users: SearchResult["users"] }) {
  if (users.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {users.map((user) => (
        <Link
          key={user.id}
          href={`/account/${user.id}`}
          className="flex items-center gap-4 rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 transition-colors hover:border-[#3f3f3f]"
        >
          <Avatar src={user.image} className="h-12 w-12 flex-shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{user.name ?? "Unknown"}</p>
            <p className="text-sm text-gray-500">
              {user._count.followers} follower{user._count.followers !== 1 ? "s" : ""}
            </p>
          </div>
          {(user._count.betsWon + user._count.challengesWon) > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1">
              <span className="text-xs font-bold text-yellow-400">
                {user._count.betsWon + user._count.challengesWon}W
              </span>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

function BetResults({ bets }: { bets: SearchResult["bets"] }) {
  if (bets.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {bets.map((bet) => (
        <Link
          key={bet.id}
          href={`/bet/${bet.id}`}
          className="flex flex-col gap-2 rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] p-4 transition-colors hover:border-[#3f3f3f]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug">{bet.title}</p>
            <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${statusColor(bet.status)}`}>
              {bet.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Avatar src={bet.creator.image} className="h-5 w-5 rounded-full" />
            <span>{bet.creator.name ?? "?"}</span>
            <span className="font-bold text-primary">VS</span>
            <Avatar src={bet.opponent.image} className="h-5 w-5 rounded-full" />
            <span>{bet.opponent.name ?? "?"}</span>
            <span className="ml-auto">{calculateCreatedTime(bet.createdAt)}</span>
          </div>
          {bet.wagerAmount > 0 && (
            <p className="text-xs font-semibold text-yellow-400">{bet.wagerAmount.toLocaleString()} pts wager</p>
          )}
        </Link>
      ))}
    </div>
  );
}

function ChallengeResults({ challenges }: { challenges: SearchResult["challenges"] }) {
  if (challenges.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {challenges.map((c) => (
        <Link
          key={c.id}
          href={`/challenge/${c.id}`}
          className="flex flex-col gap-2 rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] p-4 transition-colors hover:border-[#3f3f3f]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-snug">{c.title}</p>
            <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${challengeStatusColor(c.status)}`}>
              {c.status}
            </span>
          </div>
          {c.description && (
            <p className="line-clamp-2 text-sm text-gray-400">{c.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <Avatar src={c.creator.image} className="h-5 w-5 rounded-full" />
            <span>{c.creator.name ?? "Unknown"}</span>
            <span>{c._count.participants} joined</span>
            {c.wagerAmount > 0 && (
              <span className="font-semibold text-yellow-400">{c.wagerAmount.toLocaleString()} pts buy-in</span>
            )}
            <span className="ml-auto">{calculateCreatedTime(c.createdAt)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const keyword = (router.query.keyword as string) ?? "";
  const [tab, setTab] = useState<SearchTab>("accounts");

  const { data, isLoading } = trpc.user.search.useQuery(
    { keyword },
    { enabled: keyword.length > 0 }
  );

  const tabCounts = {
    accounts: data?.users.length ?? 0,
    bets: data?.bets.length ?? 0,
    challenges: data?.challenges.length ?? 0,
  };

  const TABS: { key: SearchTab; label: string }[] = [
    { key: "accounts",   label: "Accounts" },
    { key: "bets",       label: "Bets" },
    { key: "challenges", label: "Challenges" },
  ];

  return (
    <AppLayout>
      <Sidebar />
      <div className="flex-1 lg:ml-[348px]">
        {/* Tab bar */}
        <ul className="flex border-b border-[#2f2f2f]">
          {TABS.map(({ key, label }) => (
            <li
              key={key}
              onClick={() => setTab(key)}
              className={`relative cursor-pointer px-6 pb-4 pt-5 text-sm font-semibold transition-colors ${
                tab === key
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {label}
              {data && tabCounts[key] > 0 && (
                <span className="ml-1.5 rounded-full bg-[#2f2f2f] px-1.5 py-0.5 text-[10px] font-bold text-gray-300">
                  {tabCounts[key]}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="px-4 py-5 pb-24 md:px-5 lg:pb-10">
          {!keyword && (
            <p className="py-12 text-center text-sm text-gray-500">
              Type something in the search bar to get started.
            </p>
          )}

          {keyword && isLoading && (
            <div className="flex flex-col gap-3 py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-[#1a1a1a]" />
              ))}
            </div>
          )}

          {keyword && !isLoading && data && (
            <>
              {tab === "accounts" && (
                <>
                  {data.users.length === 0
                    ? <EmptyState tab="accounts" keyword={keyword} />
                    : <AccountResults users={data.users} />}
                </>
              )}
              {tab === "bets" && (
                <>
                  {data.bets.length === 0
                    ? <EmptyState tab="bets" keyword={keyword} />
                    : <BetResults bets={data.bets} />}
                </>
              )}
              {tab === "challenges" && (
                <>
                  {data.challenges.length === 0
                    ? <EmptyState tab="challenges" keyword={keyword} />
                    : <ChallengeResults challenges={data.challenges} />}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
