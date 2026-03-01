interface AccountOption {
  id: string;
  name: string | null;
}

interface Props {
  isLoading: boolean;
  accounts: AccountOption[];
  betTitle: string;
  betDescription: string;
  betOpponentId: string;
  betDueAt: string;
  onCreateBet: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onDiscardBet: () => void;
  onBetTitleChange: (value: string) => void;
  onBetDescriptionChange: (value: string) => void;
  onBetOpponentChange: (value: string) => void;
  onBetDueAtChange: (value: string) => void;
}

export default function SubmitBet({
  isLoading,
  accounts,
  betTitle,
  betDescription,
  betOpponentId,
  betDueAt,
  onCreateBet,
  onDiscardBet,
  onBetTitleChange,
  onBetDescriptionChange,
  onBetOpponentChange,
  onBetDueAtChange,
}: Props) {
  return (
    <form onSubmit={onCreateBet} className="mt-6 w-full">
      <div className="mb-4">
        <label className="block text-sm font-semibold">Bet title</label>
        <input
          value={betTitle}
          onChange={(e) => onBetTitleChange(e.target.value)}
          maxLength={150}
          className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
          placeholder="Example: Knicks beat Celtics this Friday"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold">Description (optional)</label>
        <textarea
          value={betDescription}
          onChange={(e) => onBetDescriptionChange(e.target.value)}
          rows={4}
          maxLength={5000}
          className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
          placeholder="Bet conditions..."
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold">Choose opponent</label>
        <select
          value={betOpponentId}
          onChange={(e) => onBetOpponentChange(e.target.value)}
          className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-[#222] p-2 text-sm text-white"
        >
          <option value="">Select a user</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name ?? "Unknown"}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold">Due date (optional)</label>
        <input
          type="datetime-local"
          value={betDueAt}
          onChange={(e) => onBetDueAtChange(e.target.value)}
          className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={isLoading}
          type="button"
          onClick={onDiscardBet}
          className="w-full rounded-sm border border-[rgba(255,255,255,0.75)] bg-transparent px-4 py-2 text-sm font-semibold text-white"
        >
          Discard
        </button>
        <button
          disabled={isLoading}
          className="w-full rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {isLoading ? "Creating..." : "Create bet"}
        </button>
      </div>
    </form>
  );
}
