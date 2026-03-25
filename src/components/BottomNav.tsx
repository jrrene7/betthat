import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useUploadModal } from "src/context/UploadModalContext";
import { trpc } from "src/utils/trpc";

const iconSize = 22;

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={active ? "#ff3b5c" : "none"} stroke={active ? "#ff3b5c" : "#6b7280"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={active ? "#ff3b5c" : "#6b7280"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="white" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={active ? "#ff3b5c" : "none"} stroke={active ? "#ff3b5c" : "#6b7280"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
        className={`h-[26px] w-[26px] rounded-full object-cover transition-all ${active ? "ring-2 ring-primary ring-offset-1 ring-offset-[#0f0f0f]" : "opacity-60"}`}
        alt=""
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={active ? "#ff3b5c" : "none"} stroke={active ? "#ff3b5c" : "#6b7280"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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

  const navItem = "flex flex-1 flex-col items-center justify-center gap-[3px] py-2 active:opacity-60 transition-opacity";
  const label = (active: boolean) => `text-[10px] font-semibold ${active ? "text-primary" : "text-gray-500"}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9997] border-t border-[#1e1e1e] bg-[#0f0f0f]/95 backdrop-blur-sm lg:hidden"
         style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex h-[56px] items-center">
        {/* Home */}
        <Link href="/" className={navItem}>
          <HomeIcon active={path === "/"} />
          <span className={label(path === "/")}>Home</span>
        </Link>

        {/* Search */}
        <Link href="/search" className={navItem}>
          <SearchIcon active={path.startsWith("/search")} />
          <span className={label(path.startsWith("/search"))}>Search</span>
        </Link>

        {/* Create — center pill */}
        <button onClick={open} className={navItem}>
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-primary shadow-lg shadow-primary/30">
            <PlusIcon />
          </div>
        </button>

        {/* Inbox */}
        <Link href="/inbox" className={`${navItem} relative`}>
          <BellIcon active={path === "/inbox"} />
          {badge > 0 && (
            <span className="absolute right-[calc(50%-18px)] top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
          <span className={label(path === "/inbox")}>Inbox</span>
        </Link>

        {/* Profile */}
        <Link
          href={session?.user ? `/account/${session.user.id}` : "/sign-in"}
          className={navItem}
        >
          <ProfileIcon src={session?.user?.image} active={path.startsWith("/account")} />
          <span className={label(path.startsWith("/account"))}>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
