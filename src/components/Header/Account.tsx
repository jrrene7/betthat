import Tippy from "@tippyjs/react/headless";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Avatar from "src/components/Avatar";
import Login from "src/icons/Login";
import Plus from "src/icons/Plus";
import { useUploadModal } from "src/context/UploadModalContext";
import { trpc } from "src/utils/trpc";
import Dropdown from "./Dropdown";

export default function HeaderAccount() {
  const { data } = useSession();
  const { open } = useUploadModal();
  const { data: meData } = trpc.user.getMe.useQuery(undefined, { enabled: !!data?.user });

  return (
    <div className="flex items-center gap-3">
      {data?.user && meData?.user && (
        <div className="hidden items-center gap-1 rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-3 py-1 md:flex">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="#f59e0b">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v2m0 8v2M9.5 9.5c0-1.1.9-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 1.5S9.5 12.1 9.5 13s1 1.5 2.5 1.5 2.5-.5 2.5-1.5" stroke="#1a1a1a" strokeWidth={1.5} strokeLinecap="round" fill="none" />
          </svg>
          <span className="text-sm font-semibold text-yellow-400">{meData.user.balance.toLocaleString()}</span>
          <span className="text-xs text-gray-500">pts</span>
        </div>
      )}
      <button
        onClick={open}
        className="flex items-center rounded-[2px] bg-[#2f2f2f] px-4 py-1.5 text-white hover:bg-[#3f3f3f] md:min-w-[100px]"
      >
        <Plus />
        <p className="ml-2 hidden text-[16px] font-medium md:inline-block">
          Create
        </p>
      </button>
      {!data?.user ? (
        <Link
          href="/sign-in"
          className="flex items-center justify-center rounded-[4px] bg-primary px-4 py-1.5 text-center text-[16px] font-medium text-white md:min-w-[100px]"
        >
          <Login />
          <p className="ml-2 hidden text-[16px] font-medium md:inline-block">
            Login
          </p>
        </Link>
      ) : (
        <Tippy interactive placement="bottom-end" render={() => <Dropdown userId={data?.user?.id} />}>
          <div className="cursor-pointer">
            <div className="h-8 w-8">
              <Avatar src={data?.user?.image} className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </Tippy>
      )}
    </div>
  );
}
