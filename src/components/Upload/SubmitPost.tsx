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
    <form onSubmit={onCreatePost} className="mt-6 w-full">
      <div className="mb-4">
        <label className="block text-sm font-semibold">Post title (optional)</label>
        <input
          value={postTitle}
          onChange={(e) => onPostTitleChange(e.target.value)}
          maxLength={150}
          className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
          placeholder="What is this post about?"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold">Post content (optional)</label>
        <textarea
          value={postContent}
          onChange={(e) => onPostContentChange(e.target.value)}
          maxLength={5000}
          rows={5}
          className="mt-2 w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
          placeholder="Share your take, or post video only..."
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold">Attach video (optional)</label>
        <input
          onChange={onPostVideoChange}
          type="file"
          accept="video/*"
          className="mt-2 block w-full rounded-[4px] border border-[rgba(255,255,255,0.75)] bg-transparent p-2 text-sm text-white"
        />

        {postVideoPreview && (
          <div className="mt-3 rounded-[4px] border border-[rgba(255,255,255,0.3)] p-2">
            <video src={postVideoPreview} controls className="h-[220px] w-full rounded-sm" />
            <button
              type="button"
              onClick={onClearPostVideo}
              className="mt-2 text-xs font-semibold text-primary"
            >
              Remove video
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={isLoading}
          type="button"
          onClick={onDiscardPost}
          className="w-full rounded-sm border border-[rgba(255,255,255,0.75)] bg-transparent px-4 py-2 text-sm font-semibold text-white"
        >
          Discard
        </button>
        <button
          disabled={isLoading}
          className="w-full rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {isLoading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
