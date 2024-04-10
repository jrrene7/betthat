import Main from "src/components/Main";
import Sidebar from "../components/Sidebar";
import AppLayout from "../layouts/AppLayout";

export default function HomePage() {
  return (
    <AppLayout>
      <div>something here</div>
      <Sidebar />
      <Main />
    </AppLayout>
  );
}
