import Upload from "src/icons/Upload";

interface Props {
  title: string;
  onDiscardUpload: () => void;
  onUploadVideo: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  setTitle: (title: string) => void;
  isLoading: boolean;
}

export default function SubmitVideo({
  title,
  setTitle,
  isLoading,
  onUploadVideo,
  onDiscardUpload,
}: Props) {
  return (
    <form onSubmit={onUploadVideo} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-semibold text-gray-300">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your video a title"
          className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-300">Cover</label>
        <div className="mt-2 flex h-[120px] w-full items-center gap-3 rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md bg-[#2a2a2a] text-gray-500">
            <Upload />
          </div>
          <p className="text-xs text-gray-500">Auto-generated from video</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          disabled={isLoading}
          onClick={onDiscardUpload}
          type="button"
          className="flex-1 rounded-lg border border-[#3f3f3f] bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2a2a] disabled:opacity-50"
        >
          Discard
        </button>
        <button
          disabled={isLoading}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
        >
          {isLoading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
