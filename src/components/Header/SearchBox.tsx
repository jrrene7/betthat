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
      className="hidden w-[361px] items-center rounded-full bg-[#2F2F2F] pr-4 lg:flex"
    >
      <input
        value={textSearch}
        onChange={(e) => setTextSearch(e.target.value)}
        className="flex-1 bg-transparent py-2.5 pl-4"
        placeholder="Search"
      />
      <div className="cursor-pointer border-l border-[#484848] pl-2">
        <Search />
      </div>
    </form>
  );
}
