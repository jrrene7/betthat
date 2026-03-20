import { Icons } from "src/types";

export default function Handshake({ color = "#fff" }: Icons) {
  return (
    <svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2M9.5 9.5c0-1.1.9-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 1.5S9.5 12.1 9.5 13s1 1.5 2.5 1.5 2.5-.5 2.5-1.5" />
    </svg>
  );
}
