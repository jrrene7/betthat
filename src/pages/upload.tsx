import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import SelectVideo from "src/components/Upload/SelectVideo";
import SubmitBet from "src/components/Upload/SubmitBet";
import SubmitChallenge from "src/components/Upload/SubmitChallenge";
import SubmitPost from "src/components/Upload/SubmitPost";
import SubmitVideo from "src/components/Upload/SubmitVideo";
import AppLayout from "src/layouts/AppLayout";
import { authOptions } from "./api/auth/[...nextauth]";
import { getCloudinaryPlaybackUrl } from "src/utils/cloudinary";
import { trpc } from "src/utils/trpc";
import { RouterOutputs } from "src/utils/trpc";

type CreateMode = "video" | "post" | "bet" | "challenge";
type AccountOption = RouterOutputs["follow"]["getAccountSuggestion"]["accounts"][number];

function validateVideoFile(file: File) {
  if (!file.type.startsWith("video")) {
    return "Please select a video file";
  }

  if (file.size / 1_000_000 > 30) {
    return "File size is too large, can only be 30MB.";
  }

  return null;
}

function readVideoDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.preload = "metadata";
    video.src = tempUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(tempUrl);
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };

    video.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      reject(new Error("Could not read video metadata"));
    };
  });
}

export default function UploadPage() {
  const [mode, setMode] = useState<CreateMode>("video");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [title, setTitle] = useState("");
  const [isUploadingVideoFile, setIsUploadingVideoFile] = useState(false);

  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postVideoFile, setPostVideoFile] = useState<File | null>(null);
  const [postVideoPreview, setPostVideoPreview] = useState<string | null>(null);
  const [postVideoWidth, setPostVideoWidth] = useState(0);
  const [postVideoHeight, setPostVideoHeight] = useState(0);
  const [isUploadingPostVideo, setIsUploadingPostVideo] = useState(false);

  const [betTitle, setBetTitle] = useState("");
  const [betDescription, setBetDescription] = useState("");
  const [betOpponentId, setBetOpponentId] = useState("");
  const [betDueAt, setBetDueAt] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeStartsAt, setChallengeStartsAt] = useState("");
  const [challengeEndsAt, setChallengeEndsAt] = useState("");
  const [challengeParticipantIds, setChallengeParticipantIds] = useState<string[]>([]);

  const { data: accountData } = trpc.follow.getAccountSuggestion.useQuery();
  const createVideoMutation = trpc.video.createVideo.useMutation();
  const createPostMutation = trpc.post.createPost.useMutation();
  const createBetMutation = trpc.bet.createBet.useMutation();
  const createChallengeMutation = trpc.challenge.createChallenge.useMutation();
  const router = useRouter();

  const accountOptions = (accountData?.accounts ?? []).map((item: AccountOption) => ({
    id: item.id,
    name: item.name,
  }));

  async function uploadVideoToCloudinary(file: File, toastId: string) {
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUD_NAME;
    const uploadPreset =
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
      process.env.NEXT_PUBLIC_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary is not configured");
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await axios.post(url, formData, {
      onUploadProgress: (progress) => {
        const { loaded, total } = progress;
        const percentage = Math.round((loaded * 100) / (total || 1));
        toast.loading(`${percentage}% uploaded...`, { id: toastId });
      },
    });

    const uploadedUrl = response.data?.secure_url ?? response.data?.url ?? "";

    if (!uploadedUrl) {
      throw new Error("Cloudinary did not return a video URL");
    }

    return getCloudinaryPlaybackUrl(uploadedUrl);
  }

  async function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateVideoFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const preview = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreview(preview);

    try {
      const dimensions = await readVideoDimensions(file);
      setVideoWidth(dimensions.width);
      setVideoHeight(dimensions.height);
    } catch {
      toast.error("Could not read video metadata");
      setVideoWidth(0);
      setVideoHeight(0);
    }
  }

  async function onPostVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateVideoFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const preview = URL.createObjectURL(file);
    setPostVideoFile(file);
    setPostVideoPreview(preview);

    try {
      const dimensions = await readVideoDimensions(file);
      setPostVideoWidth(dimensions.width);
      setPostVideoHeight(dimensions.height);
    } catch {
      toast.error("Could not read video metadata");
      setPostVideoWidth(0);
      setPostVideoHeight(0);
    }
  }

  function onDiscardUpload() {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoWidth(0);
    setVideoHeight(0);
    setTitle("");
  }

  function onDiscardPost() {
    setPostTitle("");
    setPostContent("");
    setPostVideoFile(null);
    setPostVideoPreview(null);
    setPostVideoWidth(0);
    setPostVideoHeight(0);
  }

  function onDiscardBet() {
    setBetTitle("");
    setBetDescription("");
    setBetOpponentId("");
    setBetDueAt("");
  }

  function onDiscardChallenge() {
    setChallengeTitle("");
    setChallengeDescription("");
    setChallengeStartsAt("");
    setChallengeEndsAt("");
    setChallengeParticipantIds([]);
  }

  function onToggleParticipant(userId: string) {
    setChallengeParticipantIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((item) => item !== userId);
      }

      return [...prev, userId];
    });
  }

  async function onUploadVideo(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    const toastId = toast.loading("Uploading video...", { position: "top-left" });

    try {
      setIsUploadingVideoFile(true);
      const videoUrl = await uploadVideoToCloudinary(videoFile, toastId);

      let width = videoWidth;
      let height = videoHeight;

      if (!width || !height) {
        const dimensions = await readVideoDimensions(videoFile);
        width = dimensions.width;
        height = dimensions.height;
      }

      const res = await createVideoMutation.mutateAsync({
        title: title.trim(),
        videoWidth: width,
        videoHeight: height,
        videoUrl,
      });

      toast.dismiss(toastId);
      toast.success("Video uploaded successfully");
      onDiscardUpload();
      router.push(`/video/${res.video.id}`);
    } catch {
      toast.dismiss(toastId);
      toast.error("Something went wrong");
    } finally {
      setIsUploadingVideoFile(false);
    }
  }

  async function onCreatePost(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!postContent.trim() && !postVideoFile) {
      toast.error("Add text or attach a video");
      return;
    }

    const toastId = toast.loading("Creating post...", { position: "top-left" });

    try {
      let linkedVideoId: string | null = null;

      if (postVideoFile) {
        setIsUploadingPostVideo(true);
        const videoUrl = await uploadVideoToCloudinary(postVideoFile, toastId);

        let width = postVideoWidth;
        let height = postVideoHeight;

        if (!width || !height) {
          const dimensions = await readVideoDimensions(postVideoFile);
          width = dimensions.width;
          height = dimensions.height;
        }

        const createdVideo = await createVideoMutation.mutateAsync({
          title: postTitle.trim() || "Post video",
          videoWidth: width,
          videoHeight: height,
          videoUrl,
        });

        linkedVideoId = createdVideo.video.id;
      }

      await createPostMutation.mutateAsync({
        title: postTitle.trim() || null,
        content: postContent.trim(),
        videoId: linkedVideoId,
      });

      toast.dismiss(toastId);
      toast.success("Post created successfully");
      onDiscardPost();
    } catch {
      toast.dismiss(toastId);
      toast.error("Could not create post");
    } finally {
      setIsUploadingPostVideo(false);
    }
  }

  async function onCreateBet(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!betTitle.trim()) {
      toast.error("Bet title is required");
      return;
    }

    if (!betOpponentId) {
      toast.error("Please select an opponent");
      return;
    }

    try {
      const dueDateValue = betDueAt ? new Date(betDueAt) : null;
      if (dueDateValue && Number.isNaN(dueDateValue.getTime())) {
        toast.error("Invalid bet due date");
        return;
      }

      await createBetMutation.mutateAsync({
        title: betTitle.trim(),
        description: betDescription.trim() || null,
        opponentId: betOpponentId,
        dueAt: dueDateValue ? dueDateValue.toISOString() : null,
      });

      toast.success("Bet created successfully");
      onDiscardBet();
    } catch {
      toast.error("Could not create bet");
    }
  }

  async function onCreateChallenge(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!challengeTitle.trim()) {
      toast.error("Challenge title is required");
      return;
    }

    try {
      const startsAtValue = challengeStartsAt ? new Date(challengeStartsAt) : null;
      const endsAtValue = challengeEndsAt ? new Date(challengeEndsAt) : null;

      if (startsAtValue && Number.isNaN(startsAtValue.getTime())) {
        toast.error("Invalid challenge start date");
        return;
      }

      if (endsAtValue && Number.isNaN(endsAtValue.getTime())) {
        toast.error("Invalid challenge end date");
        return;
      }

      await createChallengeMutation.mutateAsync({
        title: challengeTitle.trim(),
        description: challengeDescription.trim() || null,
        participantIds: challengeParticipantIds,
        startsAt: startsAtValue ? startsAtValue.toISOString() : null,
        endsAt: endsAtValue ? endsAtValue.toISOString() : null,
      });

      toast.success("Challenge created successfully");
      onDiscardChallenge();
    } catch {
      toast.error("Could not create challenge");
    }
  }

  return (
    <AppLayout>
      <div className="w-full rounded-md bg-[#333] p-6 md:mt-5 md:h-[calc(100vh-100px)] md:overflow-y-auto">
        <div>
          <h1 className="text-[24px] font-bold">Create</h1>
          <p className="text-[16px] font-normal">
            Publish a video post, text post, bet, or challenge.
          </p>
        </div>

        <div className="mt-6 flex w-full flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("video")}
            className={`rounded-sm px-4 py-2 text-sm font-semibold ${
              mode === "video" ? "bg-primary text-white" : "bg-[#222] text-gray-300"
            }`}
          >
            Video
          </button>
          <button
            type="button"
            onClick={() => setMode("post")}
            className={`rounded-sm px-4 py-2 text-sm font-semibold ${
              mode === "post" ? "bg-primary text-white" : "bg-[#222] text-gray-300"
            }`}
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => setMode("bet")}
            className={`rounded-sm px-4 py-2 text-sm font-semibold ${
              mode === "bet" ? "bg-primary text-white" : "bg-[#222] text-gray-300"
            }`}
          >
            Bet
          </button>
          <button
            type="button"
            onClick={() => setMode("challenge")}
            className={`rounded-sm px-4 py-2 text-sm font-semibold ${
              mode === "challenge" ? "bg-primary text-white" : "bg-[#222] text-gray-300"
            }`}
          >
            Challenge
          </button>
        </div>

        {mode === "video" && (
          <div className="mt-6 flex flex-col items-center md:flex-row md:items-start">
            <label
              htmlFor="videoFileInput"
              className={`aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed md:flex md:aspect-[9/16] md:w-[260px] ${
                !videoPreview && "p-[35px]"
              } overflow-hidden text-center hover:border-primary`}
            >
              {!videoPreview ? (
                <SelectVideo onVideoFileChange={onVideoFileChange} />
              ) : (
                <div className="h-full w-full">
                  <video
                    src={videoPreview}
                    muted
                    className="h-full w-full"
                    controls
                    autoPlay
                  />
                </div>
              )}
            </label>
            <SubmitVideo
              isLoading={isUploadingVideoFile || createVideoMutation.isLoading}
              title={title}
              setTitle={setTitle}
              onDiscardUpload={onDiscardUpload}
              onUploadVideo={onUploadVideo}
            />
          </div>
        )}

        {mode === "post" && (
          <SubmitPost
            isLoading={
              isUploadingPostVideo ||
              createVideoMutation.isLoading ||
              createPostMutation.isLoading
            }
            postTitle={postTitle}
            postContent={postContent}
            postVideoPreview={postVideoPreview}
            onCreatePost={onCreatePost}
            onDiscardPost={onDiscardPost}
            onPostTitleChange={setPostTitle}
            onPostContentChange={setPostContent}
            onPostVideoChange={onPostVideoChange}
            onClearPostVideo={() => {
              setPostVideoFile(null);
              setPostVideoPreview(null);
              setPostVideoWidth(0);
              setPostVideoHeight(0);
            }}
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
            onCreateBet={onCreateBet}
            onDiscardBet={onDiscardBet}
            onBetTitleChange={setBetTitle}
            onBetDescriptionChange={setBetDescription}
            onBetOpponentChange={setBetOpponentId}
            onBetDueAtChange={setBetDueAt}
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
            selectedParticipantIds={challengeParticipantIds}
            onCreateChallenge={onCreateChallenge}
            onDiscardChallenge={onDiscardChallenge}
            onChallengeTitleChange={setChallengeTitle}
            onChallengeDescriptionChange={setChallengeDescription}
            onChallengeStartsAtChange={setChallengeStartsAt}
            onChallengeEndsAtChange={setChallengeEndsAt}
            onToggleParticipant={onToggleParticipant}
          />
        )}
      </div>
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/sign-in?redirect=/upload",
        permanent: false,
      },
      props: {},
    };
  }

  return {
    props: {},
  };
};
