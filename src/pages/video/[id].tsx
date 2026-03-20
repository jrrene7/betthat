import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import VideoInfo from "src/components/Detail/VideoInfo";
import VideoPlayerDetail from "src/components/Detail/VideoPlayerDetail";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "src/server/db/client";
import { Account, Video } from "src/types";
import {
  getCloudinaryPlaybackUrl,
  getCloudinaryPosterUrl,
} from "src/utils/cloudinary";

interface Props {
  video: Video<Account>;
}

export default function VideoPage({ video }: Props) {
  const videoUrl = getCloudinaryPlaybackUrl(video?.videoUrl);
  const poster = getCloudinaryPosterUrl(videoUrl);

  return (
    <div className="flex h-screen flex-col text-white lg:flex-row">
      <VideoPlayerDetail poster={poster} videoUrl={videoUrl} />
      <VideoInfo video={video} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const id = context.params?.id as string;

  try {
    const video = await prisma.video.findFirst({
      where: { id },
      include: {
        user: {
          include: {
            _count: {
              select: {
                followers: true,
                followings: true,
              },
            },
          },
        },
      },
    });

    if (!video) return { notFound: true };

    return {
      props: {
        video: {
          ...JSON.parse(JSON.stringify(video)),
          isLike: false,
          isFollow: false,
        },
      },
    };
  } catch (error) {
    console.error(error);
    return { props: {}, notFound: true };
  }
};
