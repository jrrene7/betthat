import { useSession } from "next-auth/react";
// import AccountSidebar from "src/components/Sidebar/AccountSidebar";
import LoginButton from "../Sidebar/LoginButton";
import AccountSidebar from "./AccountSidebar";
// import Menu from "src/components/Sidebar/Menu";


export default function Sidebar() {
  const { data } = useSession();
  return (
    <aside className="scrollbar-none fixed bottom-0 top-[48px] z-[9998] overflow-y-scroll border-r border-[#2f2f2f] bg-[#121212] pt-5 md:left-auto lg:top-[56px] lg:mr-[6px] lg:w-[348px] lg:border-none lg:pl-2">
      {/* <Menu /> */}
      {!data?.user && <LoginButton />}
      <AccountSidebar />
    </aside>
  );
}
