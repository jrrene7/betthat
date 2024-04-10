import Meta from "src/components/Meta";
import { meta } from "../utils/constants";
import Header from "../components/Header";

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="text-white">
      <Meta title={meta.title} description={meta.description} />
      <Header />
      <div className="container mt-[57px] flex">{children}</div>
    </div>
  );
}
