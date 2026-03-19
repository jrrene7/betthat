import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import { authOptions } from "src/pages/api/auth/[...nextauth]";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type Bet = RouterOutputs["bet"]["getBet"]["bet"];

const STATUS_STEPS = ["PENDING", "ACTIVE", "SETTLED"] as const;

function statusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "ACTIVE":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "SETTLED":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "DECLINED":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "CANCELLED":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function UserChip({ user, label }: { user: { id: string; name: string | null; image: string | null }; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <Link href={`/account/${user.id}`} className="flex flex-col items-center gap-1 hover:opacity-80">
        <LazyLoadImage
          src={user.image ?? undefined}
          className="h-14 w-14 rounded-full"
          effect="opacity"
        />
        <p className="text-sm font-semibold">{user.name ?? "Unknown"}</p>
      </Link>
    </div>
  );
}

function BetDetail({ bet, currentUserId }: { bet: Bet; currentUserId: string }) {
  const utils = trpc.useContext();

  const acceptMutation = trpc.bet.acceptBet.useMutation({
    onSuccess: () => {
      toast.success("Bet accepted!");
      utils.bet.getBet.invalidate();
      utils.bet.getInbox.invalidate();
    },
    onError: () => toast.error("Could not accept bet"),
  });

  const declineMutation = trpc.bet.declineBet.useMutation({
    onSuccess: () => {
      toast.success("Bet declined.");
      utils.bet.getBet.invalidate();
      utils.bet.getInbox.invalidate();
    },
    onError: () => toast.error("Could not decline bet"),
  });

  const settleMutation = trpc.bet.settleBet.useMutation({
    onSuccess: () => {
      toast.success("Bet settled!");
      utils.bet.getBet.invalidate();
    },
    onError: () => toast.error("Could not settle bet"),
  });

  const isParticipant =
    bet.creatorId === currentUserId || bet.opponentId === currentUserId;
  const isOpponent = bet.opponentId === currentUserId;
  const isLoading =
    acceptMutation.isLoading ||
    declineMutation.isLoading ||
    settleMutation.isLoading;

  const terminalStatuses = ["DECLINED", "CANCELLED", "SETTLED"];
  const isTerminal = terminalStatuses.includes(bet.status);

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 md:px-5">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bet</h1>
        <span
          className={`rounded border px-3 py-1 text-sm font-semibold ${statusColor(bet.status)}`}
        >
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
        <h2 className="text-lg font-bold">{bet.title}</h2>
        {bet.description && (
          <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
            {bet.description}
          </p>
        )}
        {bet.dueAt && (
          <p className="mt-3 text-xs text-gray-500">
            Due: {new Date(bet.dueAt).toLocaleString()}
          </p>
        )}
        {bet.resolvedAt && (
          <p className="mt-1 text-xs text-gray-500">
            Settled: {new Date(bet.resolvedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Status timeline */}
      {!["DECLINED", "CANCELLED"].includes(bet.status) && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
          {STATUS_STEPS.map((step, i) => {
            const stepIndex = STATUS_STEPS.indexOf(step);
            const currentIndex = STATUS_STEPS.indexOf(
              bet.status as (typeof STATUS_STEPS)[number]
            );
            const reached = currentIndex >= stepIndex;
            return (
              <div key={step} className="flex flex-1 flex-col items-center">
                <div
                  className={`h-3 w-3 rounded-full ${
                    reached ? "bg-primary" : "bg-[#2f2f2f]"
                  }`}
                />
                <p
                  className={`mt-1 text-xs ${
                    reached ? "text-white" : "text-gray-500"
                  }`}
                >
                  {step}
                </p>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`absolute hidden md:block h-[2px] w-16 ${
                      reached ? "bg-primary" : "bg-[#2f2f2f]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {isParticipant && !isTerminal && (
        <div className="flex flex-col gap-3">
          {/* Opponent can accept/decline PENDING bets */}
          {isOpponent && bet.status === "PENDING" && (
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
                {acceptMutation.isLoading ? "Accepting..." : "Accept Bet"}
              </button>
            </div>
          )}

          {/* Either party can settle ACTIVE bets */}
          {bet.status === "ACTIVE" && (
            <div className="rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
              <p className="mb-3 text-sm font-semibold">Settle this bet — who won?</p>
              <div className="flex gap-2">
                <button
                  disabled={isLoading}
                  onClick={() =>
                    settleMutation.mutate({
                      betId: bet.id,
                      winnerId: bet.creatorId,
                    })
                  }
                  className="flex-1 rounded border border-primary bg-transparent py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                >
                  {bet.creator.name ?? "Creator"} won
                </button>
                <button
                  disabled={isLoading}
                  onClick={() =>
                    settleMutation.mutate({
                      betId: bet.id,
                      winnerId: bet.opponentId,
                    })
                  }
                  className="flex-1 rounded border border-primary bg-transparent py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                >
                  {bet.opponent.name ?? "Opponent"} won
                </button>
              </div>
            </div>
          )}
        </div>
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
            <p className="text-sm text-red-400">Could not load bet.</p>
          </div>
        )}
        {data?.bet && session?.user && (
          <BetDetail bet={data.bet} currentUserId={session.user.id} />
        )}
      </div>
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    const id = context.params?.id as string;
    return {
      redirect: {
        destination: `/sign-in?redirect=/bet/${id}`,
        permanent: false,
      },
      props: {},
    };
  }

  return { props: {} };
};
