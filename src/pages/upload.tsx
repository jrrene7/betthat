import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import SelectVideo from "src/components/Upload/SelectVideo";
import SubmitVideo from "src/components/Upload/SubmitVideo";
import AppLayout from "src/layouts/AppLayout";
import { authOptions } from "./api/auth/[...nextauth]";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { trpc } from "src/utils/trpc";
import { useRouter } from "next/router";

export default function UploadPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [ title, setTitle] = useState("");
  const { mutateAsync } = trpc.video.createVideo.useMutation();
  const router = useRouter();

  function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video")) {
      return toast.error("Please select a video file");
    }
    if (file.size / 1_000_000 > 30) {
      return toast.error("File size is too large, can only be 30MB.");
    }
    const preview = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreview(preview);

    const video = document.createElement("video");
    video.setAttribute("src", preview);
    video.setAttribute("type", "video/mp4");
    video.addEventListener("loadedmetadata", (_) => {
      setVideoWidth(video.videoWidth);
      setVideoHeight(video.videoHeight);
    });
  }

  function onDiscardUpload() {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoWidth(0);
    setVideoHeight(0);
  }

  async function onUploadVideo(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }
    const toastId = toast.loading("Uploading video...", {position: "top-left"});

    try {
      setLoading(true);
      const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET;
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("upload_preset", uploadPreset!);

      const videoUrl = await axios.post(url, formData, {
        onUploadProgress: (progress) => {
          const { loaded, total } = progress;
          const percentage = Math.round((loaded * 100) / total!);
          toast.loading(`${percentage}% uploaded...`, {id: toastId});
        },
      });
      const res = await mutateAsync({
        title,
        videoWidth,
        videoHeight,
        videoUrl: videoUrl.data?.url,
      });
      toast.dismiss(toastId);
      toast.success("Video uploaded successfully");
      onDiscardUpload()
      setTitle("");
      router.push(`/video/${res.video.id}`);
    } catch (error) {
      setLoading(false);
      toast.dismiss(toastId);
      toast.error("Something went wrong");
    }
    
  }

  return (
    <AppLayout>
      <div className="w-full rounded-md bg-[#333] p-6 md:mt-5 md:h-[calc(100vh-100px)]">
        <div>
          <h1 className="text-[24px] font-bold">Upload video</h1>
          <p className="text-[16px] font-normal">
            Post a video to your account
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center md:flex-row">
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
          <SubmitVideo isLoading={isLoading} setTitle={setTitle} onDiscardUpload={onDiscardUpload} onUploadVideo={onUploadVideo}/>
        </div>
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
      props: {},
    };
  } else {
    return {
      redirect: {
        destination: "/sign-in?redirect=/upload",
        permanent: false,
      },
      props: {},
    };
  }
};
