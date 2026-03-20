import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import BetCard from "src/components/Feed/BetCard";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type Bet = RouterOutputs["bet"]["getPublicBets"]["bets"][number];

export default function BetsPage() {
  const { data, isLoading, isError } = trpc.bet.getPublicBets.useQuery({ skip: 0, limit: 30 });

  return (
    <AppLayout>
      <Sidebar />
      <div className="ml-[48px] flex-1 lg:ml-[348px] lg:mt-5">
        <div className="md:px-5">
          <h1 className="py-5 text-xl font-bold">Bets</h1>
          {isLoading && <p className="py-8 text-sm text-gray-400">Loading...</p>}
          {isError && <p className="py-8 text-sm text-red-400">Could not load bets.</p>}
          {!isLoading && !isError && data?.bets.length === 0 && (
            <p className="py-8 text-sm text-gray-400">No public bets yet.</p>
          )}
          {data?.bets.map((bet: Bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
