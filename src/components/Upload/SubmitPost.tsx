interface Props {
  isLoading: boolean;
  postTitle: string;
  postContent: string;
  postVideoPreview: string | null;
  onCreatePost: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onDiscardPost: () => void;
  onPostTitleChange: (value: string) => void;
  onPostContentChange: (value: string) => void;
  onPostVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPostVideo: () => void;
}

export default function SubmitPost({
  isLoading,
  postTitle,
  postContent,
  postVideoPreview,
  onCreatePost,
  onDiscardPost,
  onPostTitleChange,
  onPostContentChange,
  onPostVideoChange,
  onClearPostVideo,
}: Props) {
  return (
    <form onSubmit={onCreatePost} className="flex flex-col gap-5">

      {/* Video — top, prominent */}
      {!postVideoPreview ? (
        <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#3f3f3f] bg-[#111] py-12 transition-colors hover:border-primary">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2a2a2a] transition-colors group-hover:bg-primary/20">
            <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-primary">
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-300 group-hover:text-white">
              Add a video
            </p>
            <p className="mt-0.5 text-xs text-gray-500">MP4 or WebM · max 30MB</p>
          </div>
          <input
            onChange={onPostVideoChange}
            type="file"
            accept="video/*"
            className="hidden"
          />
        </label>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#3f3f3f] bg-[#111]">
          <video
            src={postVideoPreview}
            controls
            className="max-h-[400px] w-full object-contain"
          />
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs text-gray-500">Video attached</p>
            <button
              type="button"
              onClick={onClearPostVideo}
              className="text-xs font-semibold text-gray-400 hover:text-primary"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Caption */}
      <div>
        <textarea
          value={postContent}
          onChange={(e) => onPostContentChange(e.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="Write a caption..."
          className="w-full resize-none rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
      </div>

      {/* Title — secondary, collapsed visually */}
      <div>
        <label className="block text-sm font-semibold text-gray-400">
          Title <span className="font-normal text-gray-600">(optional)</span>
        </label>
        <input
          value={postTitle}
          onChange={(e) => onPostTitleChange(e.target.value)}
          maxLength={150}
          placeholder="Add a title"
          className="mt-2 w-full rounded-lg border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          disabled={isLoading}
          type="button"
          onClick={onDiscardPost}
          className="flex-1 rounded-lg border border-[#3f3f3f] bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2a2a2a] disabled:opacity-50"
        >
          Discard
        </button>
        <button
          disabled={isLoading}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
        >
          {isLoading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
