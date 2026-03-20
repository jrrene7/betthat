import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast from "react-hot-toast";
import SubmitBet from "src/components/Upload/SubmitBet";
import SubmitChallenge from "src/components/Upload/SubmitChallenge";
import SubmitPost from "src/components/Upload/SubmitPost";
import { useUploadModal } from "src/context/UploadModalContext";
import { getCloudinaryPlaybackUrl } from "src/utils/cloudinary";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type CreateMode = "post" | "bet" | "challenge";
type AccountOption = RouterOutputs["follow"]["getAccountSuggestion"]["accounts"][number];

const TABS: { mode: CreateMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: "post",
    label: "Post",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h12v2H3v-2zm0 4h12v2H3v-2z" />
      </svg>
    ),
  },
  {
    mode: "bet",
    label: "Bet",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
  },
  {
    mode: "challenge",
    label: "Challenge",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

function validateVideoFile(file: File) {
  if (!file.type.startsWith("video")) return "Please select a video file";
  if (file.size / 1_000_000 > 30) return "File too large, max 30MB.";
  return null;
}

function readVideoDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve({ width: v.videoWidth, height: v.videoHeight }); };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read video")); };
  });
}

export default function UploadModal() {
  const { isOpen, close } = useUploadModal();
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>("post");

  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postVideoFile, setPostVideoFile] = useState<File | null>(null);
  const [postVideoPreview, setPostVideoPreview] = useState<string | null>(null);
  const [postVideoWidth, setPostVideoWidth] = useState(0);
  const [postVideoHeight, setPostVideoHeight] = useState(0);
  const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);

  const [betTitle, setBetTitle] = useState("");
  const [betDescription, setBetDescription] = useState("");
  const [betOpponentId, setBetOpponentId] = useState("");
  const [betDueAt, setBetDueAt] = useState("");
  const [betWagerAmount, setBetWagerAmount] = useState(0);

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeStartsAt, setChallengeStartsAt] = useState("");
  const [challengeEndsAt, setChallengeEndsAt] = useState("");
  const [challengeWagerAmount, setChallengeWagerAmount] = useState(0);
  const [challengeParticipantIds, setChallengeParticipantIds] = useState<string[]>([]);

  const { data: accountData } = trpc.follow.getAccountSuggestion.useQuery(undefined, {
    enabled: isOpen,
  });
  const createVideoMutation = trpc.video.createVideo.useMutation();
  const createPostMutation = trpc.post.createPost.useMutation();
  const createBetMutation = trpc.bet.createBet.useMutation();
  const createChallengeMutation = trpc.challenge.createChallenge.useMutation();

  const accountOptions = (accountData?.accounts ?? []).map((item: AccountOption) => ({
    id: item.id,
    name: item.name,
    image: item.image,
  }));

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  async function uploadVideoToCloudinary(file: File, toastId: string) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      formData,
      {
        onUploadProgress: ({ loaded, total }) => {
          const pct = Math.round((loaded * 100) / (total || 1));
          toast.loading(`${pct}% uploaded...`, { id: toastId });
        },
      }
    );

    const uploadedUrl = response.data?.secure_url ?? response.data?.url ?? "";
    if (!uploadedUrl) throw new Error("No URL returned");
    return getCloudinaryPlaybackUrl(uploadedUrl);
  }

  async function onPostImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image")) { toast.error("Please select an image file"); return; }
    if (file.size / 1_000_000 > 10) { toast.error("Image too large, max 10MB"); return; }
    setPostImageFile(file);
    setPostImagePreview(URL.createObjectURL(file));
  }

  async function onPostVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateVideoFile(file);
    if (error) { toast.error(error); return; }
    setPostVideoFile(file);
    setPostVideoPreview(URL.createObjectURL(file));
    try {
      const dims = await readVideoDimensions(file);
      setPostVideoWidth(dims.width);
      setPostVideoHeight(dims.height);
    } catch {
      toast.error("Could not read video metadata");
    }
  }

  function resetPost() {
    setPostTitle(""); setPostContent("");
    setPostVideoFile(null); setPostVideoPreview(null);
    setPostVideoWidth(0); setPostVideoHeight(0);
    setPostImageFile(null); setPostImagePreview(null);
  }
  function resetBet() { setBetTitle(""); setBetDescription(""); setBetOpponentId(""); setBetDueAt(""); setBetWagerAmount(0); }
  function resetChallenge() {
    setChallengeTitle(""); setChallengeDescription("");
    setChallengeStartsAt(""); setChallengeEndsAt(""); setChallengeWagerAmount(0); setChallengeParticipantIds([]);
  }

  async function onCreatePost(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!postContent.trim() && !postVideoFile && !postImageFile) {
      toast.error("Add some text, an image, or a video");
      return;
    }
    const toastId = toast.loading("Creating post...", { position: "top-center" });
    try {
      let linkedVideoId: string | null = null;
      let linkedImageUrl: string | null = null;

      if (postVideoFile) {
        setIsUploadingPostVideo(true);
        const videoUrl = await uploadVideoToCloudinary(postVideoFile, toastId);
        let w = postVideoWidth, h = postVideoHeight;
        if (!w || !h) { const dims = await readVideoDimensions(postVideoFile); w = dims.width; h = dims.height; }
        const created = await createVideoMutation.mutateAsync({ title: postTitle.trim() || "Post video", videoWidth: w, videoHeight: h, videoUrl });
        linkedVideoId = created.video.id;
      } else if (postImageFile) {
        setIsUploadingPostImage(true);
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured");
        const formData = new FormData();
        formData.append("file", postImageFile);
        formData.append("upload_preset", uploadPreset);
        toast.loading("Uploading image...", { id: toastId });
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData,
          { onUploadProgress: ({ loaded, total }) => {
            const pct = Math.round((loaded * 100) / (total || 1));
            toast.loading(`${pct}% uploaded...`, { id: toastId });
          }}
        );
        linkedImageUrl = response.data?.secure_url ?? response.data?.url ?? null;
        if (!linkedImageUrl) throw new Error("No image URL returned");
      }

      await createPostMutation.mutateAsync({
        title: postTitle.trim() || null,
        content: postContent.trim(),
        videoId: linkedVideoId,
        imageUrl: linkedImageUrl,
      });
      toast.dismiss(toastId);
      toast.success("Post created!");
      resetPost();
      close();
    } catch {
      toast.dismiss(toastId);
      toast.error("Could not create post");
    } finally {
      setIsUploadingPostVideo(false);
      setIsUploadingPostImage(false);
    }
  }

  async function onCreateBet(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!betTitle.trim()) { toast.error("Bet title is required"); return; }
    if (!betOpponentId) { toast.error("Please select an opponent"); return; }
    try {
      const dueDate = betDueAt ? new Date(betDueAt) : null;
      if (dueDate && Number.isNaN(dueDate.getTime())) { toast.error("Invalid due date"); return; }
      const { bet } = await createBetMutation.mutateAsync({ title: betTitle.trim(), description: betDescription.trim() || null, opponentId: betOpponentId, dueAt: dueDate ? dueDate.toISOString() : null, wagerAmount: betWagerAmount });
      toast.success("Bet sent!");
      resetBet();
      close();
      router.push(`/bet/${bet.id}`);
    } catch {
      toast.error("Could not create bet");
    }
  }

  async function onCreateChallenge(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!challengeTitle.trim()) { toast.error("Challenge title is required"); return; }
    try {
      const startsAt = challengeStartsAt ? new Date(challengeStartsAt) : null;
      const endsAt = challengeEndsAt ? new Date(challengeEndsAt) : null;
      if (startsAt && Number.isNaN(startsAt.getTime())) { toast.error("Invalid start date"); return; }
      if (endsAt && Number.isNaN(endsAt.getTime())) { toast.error("Invalid end date"); return; }
      const { challenge } = await createChallengeMutation.mutateAsync({ title: challengeTitle.trim(), description: challengeDescription.trim() || null, participantIds: challengeParticipantIds, startsAt: startsAt ? startsAt.toISOString() : null, endsAt: endsAt ? endsAt.toISOString() : null, wagerAmount: challengeWagerAmount });
      toast.success("Challenge created!");
      resetChallenge();
      close();
      router.push(`/challenge/${challenge.id}`);
    } catch {
      toast.error("Could not create challenge");
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#2f2f2f] bg-[#121212] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2f2f2f] px-5 py-4">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isActive = mode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  type="button"
                  onClick={() => setMode(tab.mode)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#2f2f2f] hover:text-white"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto px-5 py-5">
          {mode === "post" && (
            <SubmitPost
              isLoading={isUploadingPostVideo || isUploadingPostImage || createVideoMutation.isLoading || createPostMutation.isLoading}
              postTitle={postTitle}
              postContent={postContent}
              postVideoPreview={postVideoPreview}
              postImagePreview={postImagePreview}
              onCreatePost={onCreatePost}
              onDiscardPost={() => { resetPost(); close(); }}
              onPostTitleChange={setPostTitle}
              onPostContentChange={setPostContent}
              onPostVideoChange={onPostVideoChange}
              onClearPostVideo={() => { setPostVideoFile(null); setPostVideoPreview(null); setPostVideoWidth(0); setPostVideoHeight(0); }}
              onPostImageChange={onPostImageChange}
              onClearPostImage={() => { setPostImageFile(null); setPostImagePreview(null); }}
            />
          )}
          {mode === "bet" && (
            <SubmitBet
              isLoading={createBetMutation.isLoading}
              accounts={accountOptions}
              betTitle={betTitle}
              betDescription={betDescription}
              betOpponentId={betOpponentId}
              betDueAt={betDueAt}
              betWagerAmount={betWagerAmount}
              onCreateBet={onCreateBet}
              onDiscardBet={() => { resetBet(); close(); }}
              onBetTitleChange={setBetTitle}
              onBetDescriptionChange={setBetDescription}
              onBetOpponentChange={setBetOpponentId}
              onBetDueAtChange={setBetDueAt}
              onBetWagerAmountChange={setBetWagerAmount}
            />
          )}
          {mode === "challenge" && (
            <SubmitChallenge
              isLoading={createChallengeMutation.isLoading}
              accounts={accountOptions}
              challengeTitle={challengeTitle}
              challengeDescription={challengeDescription}
              challengeStartsAt={challengeStartsAt}
              challengeEndsAt={challengeEndsAt}
              challengeWagerAmount={challengeWagerAmount}
              selectedParticipantIds={challengeParticipantIds}
              onCreateChallenge={onCreateChallenge}
              onDiscardChallenge={() => { resetChallenge(); close(); }}
              onChallengeTitleChange={setChallengeTitle}
              onChallengeDescriptionChange={setChallengeDescription}
              onChallengeStartsAtChange={setChallengeStartsAt}
              onChallengeEndsAtChange={setChallengeEndsAt}
              onChallengeWagerAmountChange={setChallengeWagerAmount}
              onToggleParticipant={(id) =>
                setChallengeParticipantIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
