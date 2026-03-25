import Meta from "src/components/Meta";
import BottomNav from "src/components/BottomNav";
import { meta } from "../utils/constants";
import Header from "../components/Header";

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Meta title={meta.title} description={meta.description} />
      <Header />
      <div className="container mt-[52px] flex lg:mt-[57px]">{children}</div>
      <BottomNav />
    </div>
  );
}
