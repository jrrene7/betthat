import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import { DEFAULT_COLOR, PRIMARY_COLOR, menus } from "src/utils/constants";

export default function Menu() {
  return (
    <ul className="mb-4">
      {menus.map((item) => (
        <MenuItem key={item.name} item={item} />
      ))}
    </ul>
  );
}
export interface Icons {
  color: string;
} 

interface Props {
  item: {
    name: string;
    href: string;
    icons: FC<Icons>;
  };
}

function MenuItem({ item }: Props) {
  const router = useRouter();
  const isActive = router.asPath === item.href;
  return (
    <li>
      <Link href={item.href} className="flex items-center p-2">
        <item.icons color={isActive ? PRIMARY_COLOR : DEFAULT_COLOR} />{" "}
        <span
          className={`hidden text-[18px] font-semibold md:ml-2 lg:inline-block ${
            isActive && "text-primary"
          }`}
        >
          {item.name}
        </span>
      </Link>
    </li>
  );
}
