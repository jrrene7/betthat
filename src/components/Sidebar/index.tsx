import { useSession } from "next-auth/react";
import AccountSidebar from "src/components/Sidebar/AccountSidebar";
import LoginButton from "src/components/Sidebar/LoginButton";
import Menu from "src/components/Sidebar/Menu";


export default function Sidebar() {
  const { data } = useSession();
  return (
    <aside className="scrollbar-none fixed bottom-0 top-[52px] z-[9998] hidden overflow-y-scroll border-r border-[#1e1e1e] bg-[#0f0f0f] pt-5 lg:block lg:top-[57px] lg:w-[348px] lg:border-none lg:pl-2">
      <Menu />
      {!data?.user && <LoginButton />}
      <AccountSidebar title="Suggested accounts" type="getAccountSuggestion"/>
      <AccountSidebar title="Following accounts" type="getAccountFollowing"/>
    </aside>
  );
}
