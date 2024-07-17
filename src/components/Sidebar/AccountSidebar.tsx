import { useSession } from "next-auth/react";
import AccountSidebarItem from "src/components/Sidebar/AccountSidebarItem";
import { Account } from "src/types";
import { trpc } from "src/utils/trpc";

interface Props {
  title: "Suggested accounts" | "Following accounts";
  type: "getAccountSuggestion" | "getAccountFollowing";
}

export default function AccountSidebar({ title, type }: Props) {
  const { data: session } = useSession();
  const { data, isLoading } = getAccount()
  const noAccounts = data?.accounts?.length === 0;

  function getAccount() {
    if ( type === "getAccountFollowing" && session?.user) {
      return trpc.follow.getAccountFollowing.useQuery();
    }
      return trpc.follow.getAccountSuggestion.useQuery(); 
  }

  console.log(data);

  if (isLoading || noAccounts) return null;
  if (!session?.user && type === "getAccountFollowing") return null;

  return (
    <div className="border-t border-[#484848] py-4">
      <h3 className="mb-2 hidden px-2 text-sm font-medium lg:block">{title}</h3>
      <div>
        {data?.accounts.map((item) => (
          <AccountSidebarItem key={item.id} account={item as Account} />
        ))}
      </div>
    </div>
  );
}
