import Tippy from "@tippyjs/react/headless";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Login from "src/icons/Login";
import Plus from "src/icons/Plus";
import Dropdown from "./Dropdown";

export default function HeaderAccount() {
  const { data } = useSession();
  console.log(data);

  return (
    <div className="flex items-center">
      <Link
        href="/upload"
        className="flex items-center rounded-[2px] bg-[#2f2f2f] px-4 py-1.5 text-white md:min-w-[100px]"
      >
        <Plus />
        <p className="ml-2 hidden text-[16px] font-medium md:inline-block">
          Upload
        </p>
      </Link>
      {!data?.user ? (
        <Link
          href="/sign-in"
          className="ml-4 flex items-center justify-center rounded-[4px] bg-primary px-4 py-1.5 text-center text-[16px] font-medium text-white md:min-w-[100px]"
        >
          <Login />
          <p className="ml-2 hidden text-[16px] font-medium md:inline-block">
            Login
          </p>
        </Link>
      ) : (
        <Tippy interactive placement="bottom-end" render={() => <Dropdown userId={data?.user?.id}/>}>
          <div className="ml-4 cursor-pointer">
            <div className="h-8 w-8">
              <LazyLoadImage src={data?.user?.image!} className="rounded-full" effect="opacity" />
            </div>
          </div>
        </Tippy>
      )}
    </div>
  );
}
