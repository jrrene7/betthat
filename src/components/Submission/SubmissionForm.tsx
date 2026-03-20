import { useState, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface Props {
  isLoading: boolean;
  onSubmit: (data: { content: string; mediaUrl: string | null }) => void;
  label?: string;
}

function validateImageFile(file: File) {
  if (!file.type.startsWith("image")) return "Please select an image file";
  if (file.size / 1_000_000 > 10) return "Image too large, max 10MB";
  return null;
}

function validateVideoFile(file: File) {
  if (!file.type.startsWith("video")) return "Please select a video file";
  if (file.size / 1_000_000 > 30) return "Video too large, max 30MB";
  return null;
}

async function uploadToCloudinary(file: File, type: "image" | "video", onProgress: (pct: number) => void) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("Cloudinary not configured");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
    formData,
    { onUploadProgress: ({ loaded, total }) => onProgress(Math.round((loaded * 100) / (total || 1))) }
  );
  return res.data?.secure_url ?? res.data?.url ?? null;
}

export default function SubmissionForm({ isLoading, onSubmit, label = "Submit" }: Props) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function clearMedia() {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType("image");
  }

  function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateVideoFile(file);
    if (err) { toast.error(err); return; }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType("video");
  }

  async function handleSubmit() {
    if (!content.trim() && !mediaFile) {
      toast.error("Add some text, an image, or a video");
      return;
    }

    setIsUploading(true);
    let mediaUrl: string | null = null;

    try {
      if (mediaFile && mediaType) {
        mediaUrl = await uploadToCloudinary(mediaFile, mediaType, setUploadProgress);
        if (!mediaUrl) throw new Error("Upload failed");
      }

      onSubmit({ content: content.trim(), mediaUrl });
      setContent("");
      clearMedia();
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const busy = isLoading || isUploading;
  const progressLabel = uploadProgress > 0 && uploadProgress < 100 ? `${uploadProgress}%` : "Uploading...";

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Describe your submission..."
        className="w-full resize-none rounded-lg border border-[#3f3f3f] bg-[#121212] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
      />

      {/* Media preview */}
      {mediaPreview && (
        <div className="relative overflow-hidden rounded-lg border border-[#2f2f2f]">
          {mediaType === "image" ? (
            <img src={mediaPreview} alt="" className="max-h-[300px] w-full object-contain bg-black" />
          ) : (
            <video src={mediaPreview} controls muted className="max-h-[300px] w-full bg-black object-contain" />
          )}
          <button
            type="button"
            onClick={clearMedia}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2">
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
        <button
          type="button"
          disabled={busy}
          onClick={() => { clearMedia(); imageInputRef.current?.click(); }}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            mediaType === "image" ? "bg-primary/10 text-primary" : "bg-[#2a2a2a] text-gray-400 hover:text-white"
          }`}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          Photo
        </button>

        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={onVideoChange} />
        <button
          type="button"
          disabled={busy}
          onClick={() => { clearMedia(); videoInputRef.current?.click(); }}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            mediaType === "video" ? "bg-primary/10 text-primary" : "bg-[#2a2a2a] text-gray-400 hover:text-white"
          }`}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          Video
        </button>

        <button
          type="button"
          disabled={busy || (!content.trim() && !mediaFile)}
          onClick={handleSubmit}
          className="ml-auto rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#e0354f] disabled:opacity-50"
        >
          {isUploading ? progressLabel : label}
        </button>
      </div>
    </div>
  );
}
