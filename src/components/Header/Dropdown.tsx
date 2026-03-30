import { signOut } from "next-auth/react";
import Link from "next/link";
import Logout from "src/icons/Logout";
import Profile from "src/icons/Profile";
import { useUser } from "src/context/UserContext";

interface Props {
  userId?: String;
}

export default function Dropdown({ userId }: Props) {
  const { openEdit } = useUser();

  return (
    <div className="overflow-hidden rounded-md bg-[#222]">
      <ul>
        <li className="border-b border-gray-600 py-2 pl-4 pr-8 transition-colors hover:bg-[#333]">
          <Link href={`/account/${userId}`} className="flex items-center font-normal">
            <Profile /> View profile
          </Link>
        </li>
        <li
          onClick={openEdit}
          className="flex cursor-pointer items-center border-b border-gray-600 px-4 py-2 transition-colors hover:bg-[#333]"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mr-2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Edit profile
        </li>
        <li onClick={() => signOut()} className="flex cursor-pointer items-center px-4 py-2 transition-colors hover:bg-[#333]">
          <Logout />
          <button>Log out</button>
        </li>
      </ul>
    </div>
  );
}
