import { useState } from "react";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Avatar from "src/components/Avatar";
import toast from "react-hot-toast";
import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import { authOptions } from "./api/auth/[...nextauth]";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";
import { calculateCreatedTime } from "src/utils";

type Bet = RouterOutputs["bet"]["getInbox"]["bets"][number];
type Notification = RouterOutputs["notification"]["getNotifications"]["notifications"][number];
type ChallengeInvite = RouterOutputs["challenge"]["getPendingInvites"]["invites"][number];
type InboxTab = "bets" | "challenges" | "notifications";

const NOTIF_ICON: Record<string, string> = {
  BET_RECEIVED: "🤝",
  BET_ACCEPTED: "✅",
  BET_DECLINED: "❌",
  CHALLENGE_INVITED: "🏆",
  CHALLENGE_JOINED: "👋",
  CHALLENGE_COMPLETED: "🎉",
  CHALLENGE_INVITE_ACCEPTED: "✅",
  CHALLENGE_INVITE_DECLINED: "❌",
};

function statusColor(status: string) {
  switch (status) {
    case "PENDING":   return "bg-yellow-500/20 text-yellow-400";
    case "ACTIVE":    return "bg-green-500/20 text-green-400";
    case "SETTLED":   return "bg-gray-500/20 text-gray-400";
    case "DECLINED":  return "bg-red-500/20 text-red-400";
    default:          return "bg-blue-500/20 text-blue-400";
  }
}

function BetInboxItem({ bet }: { bet: Bet }) {
  const utils = trpc.useContext();

  const acceptMutation = trpc.bet.acceptBet.useMutation({
    onSuccess: () => { toast.success("Bet accepted!"); utils.bet.getInbox.invalidate(); utils.bet.getInboxCount.invalidate(); },
    onError: () => toast.error("Could not accept bet"),
  });
  const declineMutation = trpc.bet.declineBet.useMutation({
    onSuccess: () => { toast.success("Bet declined."); utils.bet.getInbox.invalidate(); utils.bet.getInboxCount.invalidate(); },
    onError: () => toast.error("Could not decline bet"),
  });

  const isLoading = acceptMutation.isLoading || declineMutation.isLoading;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href={`/account/${bet.creator.id}`}>
            <Avatar src={bet.creator.image} className="h-10 w-10 rounded-full" />
          </Link>
          <div>
            <p className="text-sm font-semibold">
              <Link href={`/account/${bet.creator.id}`} className="hover:underline">
                {bet.creator.name ?? "Unknown"}
              </Link>{" "}
              <span className="font-normal text-gray-400">challenged you to a bet</span>
            </p>
            <p className="text-xs text-gray-500">{calculateCreatedTime(bet.createdAt)}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${statusColor(bet.status)}`}>
          {bet.status}
        </span>
      </div>

      <div>
        <Link href={`/bet/${bet.id}`}>
          <p className="font-semibold hover:underline">{bet.title}</p>
        </Link>
        {bet.description && (
          <p className="mt-1 text-sm text-gray-400 line-clamp-2">{bet.description}</p>
        )}
        {bet.wagerAmount > 0 && (
          <p className="mt-1 text-xs font-semibold text-yellow-400">{bet.wagerAmount.toLocaleString()} pts wager</p>
        )}
        {bet.dueAt && (
          <p className="mt-1 text-xs text-gray-500">Due: {new Date(bet.dueAt).toLocaleDateString()}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          disabled={isLoading}
          onClick={() => declineMutation.mutate({ betId: bet.id })}
          className="flex-1 rounded border border-[rgba(255,255,255,0.2)] bg-transparent py-2 text-sm font-semibold text-white hover:bg-[#2f2f2f] disabled:opacity-50"
        >
          Decline
        </button>
        <button
          disabled={isLoading}
          onClick={() => acceptMutation.mutate({ betId: bet.id })}
          className="flex-1 rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
        >
          {acceptMutation.isLoading ? "Accepting..." : "Accept"}
        </button>
      </div>
    </div>
  );
}

function ChallengeInviteItem({ invite }: { invite: ChallengeInvite }) {
  const utils = trpc.useContext();
  const challenge = invite.challenge;

  const acceptMutation = trpc.challenge.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("Challenge accepted!");
      utils.challenge.getPendingInvites.invalidate();
      utils.bet.getInboxCount.invalidate();
    },
    onError: (err) => toast.error(err.message || "Could not accept invite"),
  });
  const declineMutation = trpc.challenge.declineInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite declined.");
      utils.challenge.getPendingInvites.invalidate();
      utils.bet.getInboxCount.invalidate();
    },
    onError: () => toast.error("Could not decline invite"),
  });

  const isLoading = acceptMutation.isLoading || declineMutation.isLoading;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href={`/account/${challenge.creator.id}`}>
            <Avatar src={challenge.creator.image} className="h-10 w-10 rounded-full" />
          </Link>
          <div>
            <p className="text-sm font-semibold">
              <Link href={`/account/${challenge.creator.id}`} className="hover:underline">
                {challenge.creator.name ?? "Unknown"}
              </Link>{" "}
              <span className="font-normal text-gray-400">invited you to a challenge</span>
            </p>
            <p className="text-xs text-gray-500">{calculateCreatedTime(invite.joinedAt)}</p>
          </div>
        </div>
        <span className="flex-shrink-0 rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">
          {challenge.status}
        </span>
      </div>

      <div>
        <Link href={`/challenge/${challenge.id}`}>
          <p className="font-semibold hover:underline">{challenge.title}</p>
        </Link>
        {challenge.description && (
          <p className="mt-1 text-sm text-gray-400 line-clamp-2">{challenge.description}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
          <span>{challenge._count.participants} participant{challenge._count.participants !== 1 ? "s" : ""}</span>
          {challenge.wagerAmount > 0 && (
            <span className="font-semibold text-yellow-400">{challenge.wagerAmount.toLocaleString()} pts buy-in</span>
          )}
          {challenge.endsAt && (
            <span>Ends {new Date(challenge.endsAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          disabled={isLoading}
          onClick={() => declineMutation.mutate({ challengeId: challenge.id })}
          className="flex-1 rounded border border-[rgba(255,255,255,0.2)] bg-transparent py-2 text-sm font-semibold text-white hover:bg-[#2f2f2f] disabled:opacity-50"
        >
          Decline
        </button>
        <button
          disabled={isLoading}
          onClick={() => acceptMutation.mutate({ challengeId: challenge.id })}
          className="flex-1 rounded bg-primary py-2 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
        >
          {acceptMutation.isLoading ? "Accepting..." : challenge.wagerAmount > 0 ? `Accept (${challenge.wagerAmount.toLocaleString()} pts)` : "Accept"}
        </button>
      </div>
    </div>
  );
}

function NotifItem({ notif }: { notif: Notification }) {
  const entityHref =
    notif.entityType === "bet" ? `/bet/${notif.entityId}` :
    notif.entityType === "challenge" ? `/challenge/${notif.entityId}` :
    null;

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
      notif.read ? "border-[#2f2f2f] bg-[#1a1a1a]" : "border-primary/30 bg-primary/5"
    }`}>
      <span className="text-xl leading-none">{NOTIF_ICON[notif.type] ?? "🔔"}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {notif.actor && (
            <Link href={`/account/${notif.actor.id}`} className="font-semibold hover:underline">
              {notif.actor.name ?? "Someone"}
            </Link>
          )}{" "}
          <span className="text-gray-300">{notif.message}</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{calculateCreatedTime(notif.createdAt)}</p>
      </div>
      {entityHref && (
        <Link
          href={entityHref}
          className="flex-shrink-0 rounded border border-[#3f3f3f] px-2.5 py-1 text-xs font-semibold text-gray-400 hover:border-gray-300 hover:text-white"
        >
          View
        </Link>
      )}
    </div>
  );
}

export default function InboxPage() {
  const [tab, setTab] = useState<InboxTab>("bets");
  const utils = trpc.useContext();

  const { data: betsData, isLoading: betsLoading } = trpc.bet.getInbox.useQuery();
  const { data: invitesData, isLoading: invitesLoading } = trpc.challenge.getPendingInvites.useQuery();
  const { data: notifsData, isLoading: notifsLoading } = trpc.notification.getNotifications.useQuery();

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => utils.notification.getNotifications.invalidate(),
  });

  const pendingBetCount = betsData?.bets.length ?? 0;
  const pendingInviteCount = invitesData?.invites.length ?? 0;
  const unreadCount = notifsData?.unreadCount ?? 0;

  const TABS: { key: InboxTab; label: string; badge: number }[] = [
    { key: "bets",          label: "Bets",       badge: pendingBetCount },
    { key: "challenges",    label: "Challenges",  badge: pendingInviteCount },
    { key: "notifications", label: "Notifications", badge: unreadCount },
  ];

  return (
    <AppLayout>
      <Sidebar />
      <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
        <div className="mx-auto max-w-xl px-4 pb-24 md:px-5 lg:pb-10">
          <h1 className="mb-6 text-2xl font-bold">Inbox</h1>

          {/* Tabs */}
          <div className="mb-6 flex border-b border-[#2f2f2f]">
            {TABS.map(({ key, label, badge }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                  tab === key ? "border-b-2 border-primary text-primary" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {label}
                {badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-white">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Pending Bets tab */}
          {tab === "bets" && (
            <>
              {betsLoading && <p className="py-8 text-sm text-gray-400">Loading...</p>}
              {!betsLoading && pendingBetCount === 0 && (
                <p className="py-8 text-sm text-gray-400">
                  No pending bets. When someone challenges you, it will appear here.
                </p>
              )}
              <div className="flex flex-col gap-4">
                {betsData?.bets.map((bet) => (
                  <BetInboxItem key={bet.id} bet={bet} />
                ))}
              </div>
            </>
          )}

          {/* Challenge Invites tab */}
          {tab === "challenges" && (
            <>
              {invitesLoading && <p className="py-8 text-sm text-gray-400">Loading...</p>}
              {!invitesLoading && pendingInviteCount === 0 && (
                <p className="py-8 text-sm text-gray-400">
                  No pending challenge invites.
                </p>
              )}
              <div className="flex flex-col gap-4">
                {invitesData?.invites.map((invite) => (
                  <ChallengeInviteItem key={invite.id} invite={invite} />
                ))}
              </div>
            </>
          )}

          {/* Notifications tab */}
          {tab === "notifications" && (
            <>
              {notifsLoading && <p className="py-8 text-sm text-gray-400">Loading...</p>}
              {!notifsLoading && (notifsData?.notifications.length ?? 0) === 0 && (
                <p className="py-8 text-sm text-gray-400">No notifications yet.</p>
              )}
              {unreadCount > 0 && (
                <div className="mb-4 flex justify-end">
                  <button
                    disabled={markAllRead.isLoading}
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-gray-500 hover:text-white disabled:opacity-50"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {notifsData?.notifications.map((n) => (
                  <NotifItem key={n.id} notif={n} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user) {
    return {
      redirect: { destination: "/sign-in?redirect=/inbox", permanent: false },
      props: {},
    };
  }
  return { props: {} };
};
