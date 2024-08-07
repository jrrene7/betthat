import Link from "next/link";
import HeaderAccount from "src/components/Header/Account";
import SearchInput from "src/components/Header/SearchBox";
import Logo from "src/icons/Logo";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-[9999] border-b border-[#484848] bg-[#121212]">
      <div className="container flex items-center justify-between py-2 pl-4 pr-4 lg:pl-5 lg:pr-5">
        <Link href="/">
          {/* <Logo /> */}BET THAT
        </Link>
        <SearchInput />
        <HeaderAccount />
      </div>
    </header>
  );
}
