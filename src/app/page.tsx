import Image from "next/image";
import Bet from "./Bet";
import { Key } from "react";

export default async function Home() {
  const response = await fetch("http://localhost:3030/api/bets/");
  const bets = await response.json();
  console.log(bets);
  return (
    <main>
      <h1>Latest Posts</h1>
      {bets.map((bet: { id: Key | null | undefined; }) => (
        <Bet key={bet.id} bet={bet} />
      ))}
    </main>
  );
}
