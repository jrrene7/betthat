import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import VideoInfo from "src/components/Detail/VideoInfo";
import VideoPlayerDetail from "src/components/Detail/VideoPlayerDetail";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "src/server/db/client";
import { Account, Video } from "src/types";

interface Props {
  video: Video<Account>
}

export default function VideoPage({ video }: Props) {
  const poster = `${video?.videoUrl?.split('.mp4')[0]}.jpg`;
  return (
    <div className="flex h-screen flex-col text-white lg:flex-row">
      <VideoPlayerDetail poster={poster} videoUrl={video?.videoUrl} />
      <VideoInfo video={video} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const id = context.params?.id as string;
  const session = await getServerSession(context.req, context.res, authOptions);
  let isFollow = false;
  let isLike = false;

  try {
    const video = await prisma.video.findFirst({
      where: {
        id,
      },
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
        _count: {
          select: {
            likes: true,
            comment: true,
          },
        },
        comment: {
          include: {
            user: true,
          },
        }
      },
    });
    if (session?.user) {
      const [likedByMe, followedByMe] = await Promise.all([
        prisma.likes.findFirst({
          where: {
            userId: session?.user?.id,
            videoId: video?.id,
          },
        }),
        prisma.follow.findFirst({
          where: {
            followerId: session?.user?.id,
            followingId: video?.user?.id,
          },
        })
      ]);
      isLike = Boolean(likedByMe);
      isFollow = Boolean(followedByMe);
    }
    return {
      props: {
        video: {
          ...JSON.parse(JSON.stringify(video)),
        isFollow,
        isLike,
        }
      },
    }
  } catch (error) {
    console.log(error);
    return {
      props: {},
      notFound: true
    }
  }
};
