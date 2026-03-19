import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import toast from "react-hot-toast";
import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import { authOptions } from "./api/auth/[...nextauth]";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";
import { calculateCreatedTime } from "src/utils";

type Bet = RouterOutputs["bet"]["getInbox"]["bets"][number];

function statusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500/20 text-yellow-400";
    case "ACTIVE":
      return "bg-green-500/20 text-green-400";
    case "SETTLED":
      return "bg-gray-500/20 text-gray-400";
    case "DECLINED":
      return "bg-red-500/20 text-red-400";
    case "CANCELLED":
      return "bg-gray-500/20 text-gray-400";
    default:
      return "bg-blue-500/20 text-blue-400";
  }
}

function BetInboxItem({ bet }: { bet: Bet }) {
  const utils = trpc.useContext();

  const acceptMutation = trpc.bet.acceptBet.useMutation({
    onSuccess: () => {
      toast.success("Bet accepted!");
      utils.bet.getInbox.invalidate();
    },
    onError: () => toast.error("Could not accept bet"),
  });

  const declineMutation = trpc.bet.declineBet.useMutation({
    onSuccess: () => {
      toast.success("Bet declined.");
      utils.bet.getInbox.invalidate();
    },
    onError: () => toast.error("Could not decline bet"),
  });

  const isLoading = acceptMutation.isLoading || declineMutation.isLoading;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href={`/account/${bet.creator.id}`}>
            <LazyLoadImage
              src={bet.creator.image ?? undefined}
              className="h-10 w-10 rounded-full"
              effect="opacity"
            />
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
        {bet.dueAt && (
          <p className="mt-1 text-xs text-gray-500">
            Due: {new Date(bet.dueAt).toLocaleDateString()}
          </p>
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

export default function InboxPage() {
  const { data, isLoading, isError } = trpc.bet.getInbox.useQuery();

  return (
    <AppLayout>
      <Sidebar />
      <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
        <div className="mx-auto max-w-xl px-4 pb-10 md:px-5">
          <h1 className="mb-6 text-2xl font-bold">Inbox</h1>

          {isLoading && (
            <p className="py-8 text-sm text-gray-400">Loading...</p>
          )}
          {isError && (
            <p className="py-8 text-sm text-red-400">Could not load inbox.</p>
          )}
          {!isLoading && !isError && data?.bets.length === 0 && (
            <p className="py-8 text-sm text-gray-400">
              No pending bets. When someone challenges you, it will appear here.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {data?.bets.map((bet: Bet) => (
              <BetInboxItem key={bet.id} bet={bet} />
            ))}
          </div>
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
      redirect: {
        destination: "/sign-in?redirect=/inbox",
        permanent: false,
      },
      props: {},
    };
  }

  return { props: {} };
};
