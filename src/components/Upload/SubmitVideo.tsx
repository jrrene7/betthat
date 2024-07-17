import Upload from "src/icons/Upload";

interface Props {
  onDiscardUpload: () => void;
  onUploadVideo: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  setTitle: (title: string) => void;
  isLoading: boolean;
}

export default function SubmitVideo({ setTitle, isLoading, onUploadVideo, onDiscardUpload }: Props) {
  return (
    <form onSubmit={onUploadVideo} className="mt-5 w-full flex-1 md:ml-6 md:mt-0">
      <div className="mb-6 w-full">
        <label className="block text-[16px] font-semibold">Title</label>
        <input onChange={e => setTitle(e.target.value)} className="mt-4 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white" />
      </div>
      <div className="mb-6 w-full">
        <label className="block text-[16px] font-semibold">Cover</label>
        <div className="mt-4 h-[168px] w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white">
          <div className="flex h-full w-[85px] items-center justify-center rounded-sm bg-[#222]">
            <Upload />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={isLoading}
          onClick={onDiscardUpload}
          type="button"
          className="w-full rounded-sm border border-[rgba(255,255,255,0.75)] bg-transparent px-4 py-2 text-sm font-semibold text-white"
        >
          Discard
        </button>
        <button className="w-full rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white">
          Upload
        </button>
      </div>
    </form>
  );
}
