interface AccountOption {
  id: string;
  name: string | null;
}

interface Props {
  isLoading: boolean;
  accounts: AccountOption[];
  challengeTitle: string;
  challengeDescription: string;
  challengeStartsAt: string;
  challengeEndsAt: string;
  selectedParticipantIds: string[];
  onCreateChallenge: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onDiscardChallenge: () => void;
  onChallengeTitleChange: (value: string) => void;
  onChallengeDescriptionChange: (value: string) => void;
  onChallengeStartsAtChange: (value: string) => void;
  onChallengeEndsAtChange: (value: string) => void;
  onToggleParticipant: (userId: string) => void;
}

export default function SubmitChallenge({
  isLoading,
  accounts,
  challengeTitle,
  challengeDescription,
  challengeStartsAt,
  challengeEndsAt,
  selectedParticipantIds,
  onCreateChallenge,
  onDiscardChallenge,
  onChallengeTitleChange,
  onChallengeDescriptionChange,
  onChallengeStartsAtChange,
  onChallengeEndsAtChange,
  onToggleParticipant,
}: Props) {
  return (
    <form onSubmit={onCreateChallenge} className="mt-6 w-full">
      <div className="mb-4">
        <label className="block text-sm font-semibold">Challenge title</label>
        <input
          value={challengeTitle}
          onChange={(e) => onChallengeTitleChange(e.target.value)}
          maxLength={150}
          className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
          placeholder="Example: March Madness Bracket Challenge"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold">Description (optional)</label>
        <textarea
          value={challengeDescription}
          onChange={(e) => onChallengeDescriptionChange(e.target.value)}
          rows={4}
          maxLength={5000}
          className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
          placeholder="Challenge rules..."
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold">Starts at (optional)</label>
          <input
            type="datetime-local"
            value={challengeStartsAt}
            onChange={(e) => onChallengeStartsAtChange(e.target.value)}
            className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold">Ends at (optional)</label>
          <input
            type="datetime-local"
            value={challengeEndsAt}
            onChange={(e) => onChallengeEndsAtChange(e.target.value)}
            className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold">Participants</label>
        <div className="mt-2 max-h-[180px] overflow-y-auto rounded-[4px] border border-[rgba(255,255,255,0.75)] p-2">
          {accounts.length === 0 && (
            <p className="text-sm text-[rgba(255,255,255,0.75)]">No users available.</p>
          )}
          {accounts.map((account) => {
            const isSelected = selectedParticipantIds.includes(account.id);
            return (
              <label key={account.id} className="mb-2 flex cursor-pointer items-center text-sm last:mb-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleParticipant(account.id)}
                  className="mr-2"
                />
                <span>{account.name ?? "Unknown"}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={isLoading}
          type="button"
          onClick={onDiscardChallenge}
          className="w-full rounded-sm border border-[rgba(255,255,255,0.75)] bg-transparent px-4 py-2 text-sm font-semibold text-white"
        >
          Discard
        </button>
        <button
          disabled={isLoading}
          className="w-full rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {isLoading ? "Creating..." : "Create challenge"}
        </button>
      </div>
    </form>
  );
}
