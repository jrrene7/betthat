import Link from "next/link";
import Logout from "../../icons/Logout";
import Profile from "../../icons/Profile";
import { signOut } from "next-auth/react";

interface Props {
  userId?: string;
}

export default function Dropdown({ userId }: Props) {
  return (
    <div className="overflow-hidden rounded-md bg-[#222]">
      <ul>
        <li className="border-b border-gray-600 py-2 pl-4 pr-8 transition-colors hover:bg-[#333]">
          <Link href={`/account/${userId}`} className="flex items-center font-normal">
            <Profile /> View profile
          </Link>
        </li>
        <li onClick={() => signOut()} className="flex cursor-pointer items-center px-4 py-2 transition-colors hover:bg-[#333]">
          <Logout />
          <button>Log out</button>
        </li>
      </ul>
    </div>
  );
}
