import Tippy from "@tippyjs/react/headless";
import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Account } from "src/types";
import AccountPreview from "./AccountPreview";
import { getUsername } from "src/utils";

interface Props {
  account: Account;
}

export default function AccountSidebarItem({ account }: Props) {
  return (
    <Tippy
      delay={200}
      offset={[0, -5]}
      placement="bottom-start"
      interactive
      render={() => <AccountPreview account={account} />}
    >
      <Link href={`/account/${account?.id}`} className="flex cursor-pointer items-center p-2">
        <div className="h-8 w-8 lg:mr-3">
          <LazyLoadImage src={account?.image} className="rounded-full" effect="opacity" />
        </div>
        <div className="hidden flex-1 lg:block">
          <h3 className="line-clamp-1 mt-[-2px] flex items-center text-[16px] font-bold">
            @{getUsername(account?.name)}
          </h3>
          <p className="line-clamp-1 text-[12px] text-[rgba(255,255,255,0.75)]">
            {account?.name}
          </p>
        </div>
      </Link>
    </Tippy>
  );
}
