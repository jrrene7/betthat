import AppLayout from "src/layouts/AppLayout";
import Sidebar from "src/components/Sidebar";
import ChallengeCard from "src/components/Feed/ChallengeCard";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type Challenge = RouterOutputs["challenge"]["getPublicChallenges"]["challenges"][number];

export default function ChallengesPage() {
  const { data, isLoading, isError } = trpc.challenge.getPublicChallenges.useQuery({ skip: 0, limit: 30 });

  return (
    <AppLayout>
      <Sidebar />
      <div className="flex-1 lg:ml-[348px] lg:mt-5">
        <div>
          <h1 className="px-4 py-5 text-xl font-bold">Challenges</h1>
          {isLoading && <p className="py-8 text-sm text-gray-400">Loading...</p>}
          {isError && <p className="py-8 text-sm text-red-400">Could not load challenges.</p>}
          {!isLoading && !isError && data?.challenges.length === 0 && (
            <p className="py-8 text-sm text-gray-400">No public challenges yet.</p>
          )}
          {data?.challenges.map((challenge: Challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
