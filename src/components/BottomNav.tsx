import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useUploadModal } from "src/context/UploadModalContext";
import { trpc } from "src/utils/trpc";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill={active ? "#ff3b5c" : "none"} stroke={active ? "#ff3b5c" : "currentColor"} strokeWidth={1.8}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BetsIcon({ active }: { active: boolean }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill={active ? "#ff3b5c" : "currentColor"} className={active ? "text-primary" : "text-white"}>
      <path d="M11 17a1 1 0 0 0 1.447.894l4-2A1 1 0 0 0 17 15V9.236a1 1 0 0 0-1.447-.894l-4 2a1 1 0 0 0-.553.894V17zM15.211 6.276a1 1 0 0 0-.422-1.952l-5 1a1 1 0 0 0 .422 1.952l5-1zM16 14.309a1 1 0 0 1-.553.894l-4 2A1 1 0 0 1 10 16.31V10.56a1 1 0 0 1 .553-.894l4-2A1 1 0 0 1 16 8.56v5.75z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill={active ? "#ff3b5c" : "none"} stroke={active ? "#ff3b5c" : "currentColor"} strokeWidth={1.8}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ProfileIcon({ src, active }: { src?: string | null; active: boolean }) {
  if (src) {
    return (
      <img
        src={src}
        className={`h-7 w-7 rounded-full object-cover ${active ? "ring-2 ring-primary" : ""}`}
        alt=""
      />
    );
  }
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill={active ? "#ff3b5c" : "none"} stroke={active ? "#ff3b5c" : "currentColor"} strokeWidth={1.8}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function BottomNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const { open } = useUploadModal();

  const { data: inboxData } = trpc.bet.getInboxCount.useQuery(undefined, {
    enabled: !!session?.user,
    refetchInterval: 30_000,
  });
  const badge = inboxData?.count ?? 0;

  const path = router.asPath;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9997] flex h-[56px] items-center border-t border-[#2f2f2f] bg-[#121212] lg:hidden">
      {/* Home */}
      <Link href="/" className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2">
        <HomeIcon active={path === "/"} />
      </Link>

      {/* Bets */}
      <Link href="/bets" className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2">
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={path.startsWith("/bet") ? "#ff3b5c" : "currentColor"} strokeWidth={1.8}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </Link>

      {/* Create — center pill */}
      <button
        onClick={open}
        className="flex flex-1 flex-col items-center justify-center py-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
          <PlusIcon />
        </div>
      </button>

      {/* Inbox */}
      <Link href="/inbox" className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2">
        <BellIcon active={path === "/inbox"} />
        {badge > 0 && (
          <span className="absolute right-[20%] top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>

      {/* Profile */}
      {session?.user ? (
        <Link href={`/account/${session.user.id}`} className="flex flex-1 flex-col items-center justify-center py-2">
          <ProfileIcon src={session.user.image} active={path.startsWith("/account")} />
        </Link>
      ) : (
        <Link href="/sign-in" className="flex flex-1 flex-col items-center justify-center py-2">
          <ProfileIcon active={false} />
        </Link>
      )}
    </nav>
  );
}
