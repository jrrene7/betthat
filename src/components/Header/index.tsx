import Link from "next/link";
import HeaderAccount from "src/components/Header/Account";
import SearchInput from "src/components/Header/SearchBox";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-[9999] border-b border-[#1e1e1e] bg-[#0f0f0f]/95 backdrop-blur-sm">
      <div className="container flex h-[52px] items-center justify-between px-4 lg:h-[57px] lg:px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span className="text-[15px] font-black tracking-tight text-white">BETTHAT</span>
        </Link>

        {/* Search — desktop only */}
        <div className="hidden lg:block">
          <SearchInput />
        </div>

        {/* Account — always visible */}
        <HeaderAccount />
      </div>
    </header>
  );
}
