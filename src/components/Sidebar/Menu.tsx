import { Icons } from "../../types";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import { DEFAULT_COLOR, PRIMARY_COLOR, menus } from "src/utils/constants";
import { useUploadModal } from "src/context/UploadModalContext";
import { useSession } from "next-auth/react";
import { trpc } from "src/utils/trpc";

export default function Menu() {
  const { open } = useUploadModal();
  const { data: session } = useSession();

  const { data: inboxData } = trpc.bet.getInboxCount.useQuery(undefined, {
    enabled: !!session?.user,
    refetchInterval: 30_000,
  });
  const inboxCount = inboxData?.count ?? 0;

  return (
    <ul className="mb-4">
      {menus.map((item) => (
        <MenuItem
          key={item.name}
          item={item}
          onCreateClick={open}
          badge={item.href === "/inbox" ? inboxCount : 0}
        />
      ))}
    </ul>
  );
}

interface Props {
  item: { name: string; href: string; icons: FC<Icons> };
  onCreateClick: () => void;
  badge: number;
}

function MenuItem({ item, onCreateClick, badge }: Props) {
  const router = useRouter();
  const isActive = router.asPath === item.href;
  const isCreate = item.href === "/upload";

  const inner = (
    <div className="relative flex items-center p-2">
      <item.icons color={isActive ? PRIMARY_COLOR : DEFAULT_COLOR} />
      <span
        className={`hidden text-[18px] font-semibold md:ml-2 lg:inline-block ${
          isActive ? "text-primary" : ""
        }`}
      >
        {item.name}
      </span>
      {badge > 0 && (
        <span className="absolute left-6 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
  );

  if (isCreate) {
    return (
      <li>
        <button onClick={onCreateClick} className="flex w-full items-center">
          {inner}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link href={item.href} className="flex items-center">
        {inner}
      </Link>
    </li>
  );
}
