import Link from "next/link";
import NotFoundIcon from "src/icons/NotFound";
import AppLayout from "src/layouts/AppLayout";

export default function Error() {
  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-61px)] w-full flex-col items-center justify-center">
        <div>
          <NotFoundIcon />
        </div>

        <div className="mt-5">
          <h1 className="text-center font-semibold">Something went wrong!</h1>
          <Link
            href="/"
            className="mt-5 block w-full rounded-md border border-primary px-4 py-2 text-center text-sm font-normal text-primary"
          >
            Return to the home page
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
