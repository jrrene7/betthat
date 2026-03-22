import { Profile } from "src/types/index";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { getUsername } from "src/utils";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { trpc } from "src/utils/trpc";
import toast from "react-hot-toast";

interface Props {
  profile: Profile;
  isFollow: boolean;
}

export default function Info({ profile, isFollow }: Props) {
  const [followedByMe, setFollowedByMe] = useState(isFollow);
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === profile?.id;
  const { mutateAsync } = trpc.follow.followUser.useMutation({
    onError: () => {
      toast.error("Something went wrong");
      setFollowedByMe((prev) => !prev);
    }
  });

  function toggleFollow() {
    if (!session?.user) {
      toast.error("You must be logged in!");
      return;
    }
    if (isOwnProfile) return;
    setFollowedByMe((prev) => !prev);
    mutateAsync({ followingId: profile?.id });
  }
  
  return (
    <div className="px-4 xl:px-0">
      <div className="flex items-center">
        <div className="h-[116px] w-[116px]">
          <LazyLoadImage
            className="h-[116px] w-[116px] rounded-full"
            effect="opacity"
            src={profile?.image}
          />
        </div>
        <div className="ml-5 flex-1">
          <h1 className="text-[20px] font-semibold">
            @{getUsername(profile?.name)}
          </h1>
          <p className="text-[16px] font-normal">{profile?.name}</p>

          {
            /*later on we can add an edit button */
            !isOwnProfile && (
              <button
                onClick={toggleFollow}
                className={`mt-4 rounded-md ${
                  followedByMe ? "bg-[#2f2f2f]" : "bg-primary"
                } px-6 py-1 text-[16px] font-semibold`}
              >
                {followedByMe ? "Following" : "Follow"}
              </button>
            )
          }
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center">
          <p className="mr-2 text-[16px] font-semibold">
            {profile?._count?.followings}
          </p>
          <p className="text-[16px] font-normal text-gray-300">Following</p>
        </div>
        <div className="flex items-center">
          <p className="mr-2 text-[16px] font-semibold">
            {profile?._count?.followers}
          </p>
          <p className="text-[16px] font-normal text-gray-300">Followers</p>
        </div>
        {(profile?._count?.betsWon !== undefined) && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#1f1f1f] px-3 py-1">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm font-semibold text-yellow-400">
              {(profile._count.betsWon + (profile._count.challengesWon ?? 0))}W
            </span>
            <span className="text-xs text-gray-500">
              / {(profile._count.betsCreated ?? 0) + (profile._count.betsReceived ?? 0) + (profile._count.challengeParticipations ?? 0)} played
            </span>
          </div>
        )}
        {isOwnProfile && (profile?.balance !== undefined) && (
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 6v2m0 8v2M9 9h1.5a1.5 1.5 0 0 1 0 3H9m0 0h1.5a1.5 1.5 0 0 1 0 3H9m0-6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="text-sm font-semibold text-yellow-400">
              {profile.balance.toLocaleString()} pts
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
