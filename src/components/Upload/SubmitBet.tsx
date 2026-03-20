import { LazyLoadImage } from "react-lazy-load-image-component";

interface AccountOption {
  id: string;
  name: string | null;
  image?: string | null;
}

interface Props {
  isLoading: boolean;
  accounts: AccountOption[];
  betTitle: string;
  betDescription: string;
  betOpponentId: string;
  betDueAt: string;
  betWagerAmount: number;
  onCreateBet: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onDiscardBet: () => void;
  onBetTitleChange: (value: string) => void;
  onBetDescriptionChange: (value: string) => void;
  onBetOpponentChange: (value: string) => void;
  onBetDueAtChange: (value: string) => void;
  onBetWagerAmountChange: (value: number) => void;
}

export default function SubmitBet({
  isLoading,
  accounts,
  betTitle,
  betDescription,
  betOpponentId,
  betDueAt,
  betWagerAmount,
  onCreateBet,
  onDiscardBet,
  onBetTitleChange,
  onBetDescriptionChange,
  onBetOpponentChange,
  onBetDueAtChange,
  onBetWagerAmountChange,
}: Props) {
  return (
    <form onSubmit={onCreateBet} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-semibold text-gray-300">Bet</label>
        <input
          value={betTitle}
          onChange={(e) => onBetTitleChange(e.target.value)}
          maxLength={150}
          placeholder="e.g. Knicks beat Celtics this Friday"
          className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300">
          Conditions <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          value={betDescription}
          onChange={(e) => onBetDescriptionChange(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="Describe the terms and conditions of the bet..."
          className="mt-2 w-full resize-none rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300">Opponent</label>
        <div className="mt-2 max-h-[220px] overflow-y-auto rounded-lg border border-[#3f3f3f] bg-[#1a1a1a]">
          {accounts.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">No users available.</p>
          )}
          {accounts.map((account) => {
            const isSelected = betOpponentId === account.id;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => onBetOpponentChange(isSelected ? "" : account.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[#2a2a2a] ${
                  isSelected ? "bg-primary/10 text-white" : "text-gray-300"
                }`}
              >
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-[#2a2a2a]">
                  {account.image && (
                    <LazyLoadImage
                      src={account.image}
                      className="h-full w-full object-cover"
                      effect="opacity"
                    />
                  )}
                </div>
                <span className="flex-1 font-medium">{account.name ?? "Unknown"}</span>
                {isSelected && (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                    <path d="M20 6L9 17l-5-5 1.41-1.41L9 14.17l9.59-9.59L20 6z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300">
          Wager <span className="font-normal text-gray-500">(pts, optional)</span>
        </label>
        <input
          type="number"
          min={0}
          max={100000}
          step={10}
          value={betWagerAmount}
          onChange={(e) => onBetWagerAmountChange(Math.max(0, parseInt(e.target.value) || 0))}
          placeholder="0"
          className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">Each side puts up this many points. Winner takes all.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300">
          Due date <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          type="datetime-local"
          value={betDueAt}
          onChange={(e) => onBetDueAtChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          disabled={isLoading}
          type="button"
          onClick={onDiscardBet}
          className="flex-1 rounded-lg border border-[#3f3f3f] bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2a2a] disabled:opacity-50"
        >
          Discard
        </button>
        <button
          disabled={isLoading}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Send Bet"}
        </button>
      </div>
    </form>
  );
}
