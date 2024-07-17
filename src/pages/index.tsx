import Main from "src/components/Main";
import Sidebar from "src/components/Sidebar";
import AppLayout from "src/layouts/AppLayout";
import { trpc } from "src/utils/trpc";

export default function HomePage() {
  return (
    <AppLayout>
      <Sidebar />
      <Main />
    </AppLayout>
  );
}
