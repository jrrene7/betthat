import { useRouter } from "next/router";
import React, { useState } from "react";
import Search from "src/icons/Search";

export default function SearchInput() {
  const [textSearch, setTextSearch] = useState("");
  const router = useRouter();

  function onSearchSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(`/search?keyword=${textSearch}`);
  }

  return (
    <form
      onSubmit={onSearchSubmit}
      className="flex w-[180px] items-center rounded-full bg-[#2F2F2F] pr-3 sm:w-[260px] lg:w-[361px]"
    >
      <input
        value={textSearch}
        onChange={(e) => setTextSearch(e.target.value)}
        className="flex-1 bg-transparent py-2 pl-4 text-sm"
        placeholder="Search accounts, bets..."
      />
      <button type="submit" className="cursor-pointer border-l border-[#484848] pl-2">
        <Search />
      </button>
    </form>
  );
}
