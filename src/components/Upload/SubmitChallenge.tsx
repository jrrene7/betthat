import Avatar from "src/components/Avatar";

interface AccountOption {
  id: string;
  name: string | null;
  image?: string | null;
}

interface Props {
  isLoading: boolean;
  accounts: AccountOption[];
  challengeTitle: string;
  challengeDescription: string;
  challengeStartsAt: string;
  challengeEndsAt: string;
  challengeWagerAmount: number;
  selectedParticipantIds: string[];
  onCreateChallenge: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onDiscardChallenge: () => void;
  onChallengeTitleChange: (value: string) => void;
  onChallengeDescriptionChange: (value: string) => void;
  onChallengeStartsAtChange: (value: string) => void;
  onChallengeEndsAtChange: (value: string) => void;
  onChallengeWagerAmountChange: (value: number) => void;
  onToggleParticipant: (userId: string) => void;
}

export default function SubmitChallenge({
  isLoading,
  accounts,
  challengeTitle,
  challengeDescription,
  challengeStartsAt,
  challengeEndsAt,
  challengeWagerAmount,
  selectedParticipantIds,
  onCreateChallenge,
  onDiscardChallenge,
  onChallengeTitleChange,
  onChallengeDescriptionChange,
  onChallengeStartsAtChange,
  onChallengeEndsAtChange,
  onChallengeWagerAmountChange,
  onToggleParticipant,
}: Props) {
  return (
    <form onSubmit={onCreateChallenge} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-semibold text-gray-300">Title</label>
        <input
          value={challengeTitle}
          onChange={(e) => onChallengeTitleChange(e.target.value)}
          maxLength={150}
          placeholder="e.g. March Madness Bracket Challenge"
          className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300">
          Rules <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          value={challengeDescription}
          onChange={(e) => onChallengeDescriptionChange(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="Describe how this challenge works..."
          className="mt-2 w-full resize-none rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-300">
            Starts <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={challengeStartsAt}
            onChange={(e) => onChallengeStartsAtChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300">
            Ends <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={challengeEndsAt}
            onChange={(e) => onChallengeEndsAtChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300">
          Buy-in <span className="font-normal text-gray-500">(pts per participant, optional)</span>
        </label>
        <input
          type="number"
          min={0}
          max={100000}
          step={10}
          value={challengeWagerAmount}
          onChange={(e) => onChallengeWagerAmountChange(Math.max(0, parseInt(e.target.value) || 0))}
          placeholder="0"
          className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">Each participant puts up this many points. Winner takes the pot.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300">
          Invite participants{" "}
          <span className="font-normal text-gray-500">(optional)</span>
        </label>
        {selectedParticipantIds.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            {selectedParticipantIds.length} selected
          </p>
        )}
        <div className="mt-2 max-h-[220px] overflow-y-auto rounded-lg border border-[#3f3f3f] bg-[#1a1a1a]">
          {accounts.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">No users available.</p>
          )}
          {accounts.map((account) => {
            const isSelected = selectedParticipantIds.includes(account.id);
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => onToggleParticipant(account.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[#2a2a2a] ${
                  isSelected ? "bg-primary/10 text-white" : "text-gray-300"
                }`}
              >
                <Avatar src={account.image} className="h-8 w-8 flex-shrink-0 rounded-full" />
                <span className="flex-1 font-medium">{account.name ?? "Unknown"}</span>
                <div
                  className={`h-5 w-5 flex-shrink-0 rounded border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-[#3f3f3f] bg-transparent"
                  } flex items-center justify-center`}
                >
                  {isSelected && (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="white">
                      <path d="M20 6L9 17l-5-5 1.41-1.41L9 14.17l9.59-9.59L20 6z" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          disabled={isLoading}
          type="button"
          onClick={onDiscardChallenge}
          className="flex-1 rounded-lg border border-[#3f3f3f] bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2a2a] disabled:opacity-50"
        >
          Discard
        </button>
        <button
          disabled={isLoading}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Challenge"}
        </button>
      </div>
    </form>
  );
}
