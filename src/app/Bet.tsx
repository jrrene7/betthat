import { Post, User } from "@prisma/client";
import Link from "next/link";
// import styles from "./Bet.module.css";

interface Props {
  post: Post & {
    author: User | null;
  };
}

export default function Bet({ bet }: Props) {
  const authorName = bet.user ? bet.user.firstName : "Anonymous";

  return (
    <Link href={`/posts/${bet.id}`} className="">
      <h2>{bet.title}</h2>
      <small>{authorName}</small>
    </Link>
  );
}
