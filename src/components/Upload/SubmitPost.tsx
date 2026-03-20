import { useState } from "react";

type MediaType = "none" | "image" | "video";

interface Props {
  isLoading: boolean;
  postTitle: string;
  postContent: string;
  postVideoPreview: string | null;
  postImagePreview: string | null;
  onCreatePost: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onDiscardPost: () => void;
  onPostTitleChange: (value: string) => void;
  onPostContentChange: (value: string) => void;
  onPostVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPostVideo: () => void;
  onPostImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPostImage: () => void;
}

export default function SubmitPost({
  isLoading,
  postTitle,
  postContent,
  postVideoPreview,
  postImagePreview,
  onCreatePost,
  onDiscardPost,
  onPostTitleChange,
  onPostContentChange,
  onPostVideoChange,
  onClearPostVideo,
  onPostImageChange,
  onClearPostImage,
}: Props) {
  const [mediaType, setMediaType] = useState<MediaType>("none");

  function handleSetMedia(type: MediaType) {
    if (mediaType === "image") onClearPostImage();
    if (mediaType === "video") onClearPostVideo();
    setMediaType(type);
  }

  const hasMedia = postVideoPreview || postImagePreview;

  return (
    <form onSubmit={onCreatePost} className="flex flex-col gap-5">

      {/* Media type selector */}
      {!hasMedia && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSetMedia(mediaType === "image" ? "none" : "image")}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              mediaType === "image"
                ? "border-primary bg-primary/10 text-primary"
                : "border-[#3f3f3f] text-gray-400 hover:text-gray-200"
            }`}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H3V5h18v14zm-8.5-5.5l-2.5 3.01L8 14l-3 4h14l-4.5-5.5z" />
            </svg>
            Photo
          </button>
          <button
            type="button"
            onClick={() => handleSetMedia(mediaType === "video" ? "none" : "video")}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              mediaType === "video"
                ? "border-primary bg-primary/10 text-primary"
                : "border-[#3f3f3f] text-gray-400 hover:text-gray-200"
            }`}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            Video
          </button>
        </div>
      )}

      {/* Image drop zone */}
      {mediaType === "image" && !postImagePreview && (
        <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#3f3f3f] bg-[#111] py-12 transition-colors hover:border-primary">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2a2a2a] transition-colors group-hover:bg-primary/20">
            <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-primary">
              <path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H3V5h18v14zm-8.5-5.5l-2.5 3.01L8 14l-3 4h14l-4.5-5.5z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-300 group-hover:text-white">Add a photo</p>
            <p className="mt-0.5 text-xs text-gray-500">JPG, PNG, GIF, WebP · max 10MB</p>
          </div>
          <input onChange={onPostImageChange} type="file" accept="image/*" className="hidden" />
        </label>
      )}

      {/* Image preview */}
      {postImagePreview && (
        <div className="overflow-hidden rounded-xl border border-[#3f3f3f] bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={postImagePreview} alt="Preview" className="max-h-[400px] w-full object-contain" />
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs text-gray-500">Photo attached</p>
            <button type="button" onClick={onClearPostImage} className="text-xs font-semibold text-gray-400 hover:text-primary">
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Video drop zone */}
      {mediaType === "video" && !postVideoPreview && (
        <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#3f3f3f] bg-[#111] py-12 transition-colors hover:border-primary">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2a2a2a] transition-colors group-hover:bg-primary/20">
            <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 group-hover:text-primary">
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-300 group-hover:text-white">Add a video</p>
            <p className="mt-0.5 text-xs text-gray-500">MP4 or WebM · max 30MB</p>
          </div>
          <input onChange={onPostVideoChange} type="file" accept="video/*" className="hidden" />
        </label>
      )}

      {/* Video preview */}
      {postVideoPreview && (
        <div className="overflow-hidden rounded-xl border border-[#3f3f3f] bg-[#111]">
          <video src={postVideoPreview} controls className="max-h-[400px] w-full object-contain" />
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs text-gray-500">Video attached</p>
            <button type="button" onClick={onClearPostVideo} className="text-xs font-semibold text-gray-400 hover:text-primary">
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

      {/* Title */}
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
