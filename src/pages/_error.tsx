import type { NextPageContext } from "next";
import Link from "next/link";
import AppLayout from "src/layouts/AppLayout";

interface Props {
  statusCode: number | null;
}

function ErrorPage({ statusCode }: Props) {
  const is404 = statusCode === 404;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-61px)] w-full flex-col items-center justify-center px-4 text-center">
        <p className="text-8xl font-bold text-primary opacity-80">
          {statusCode ?? "Err"}
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          {is404 ? "Page not found" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {is404
            ? "The page you're looking for doesn't exist or has been moved."
            : "An unexpected error occurred on our end. Please try again."}
        </p>
        <Link
          href="/"
          className="mt-8 rounded-md border border-primary px-6 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-black"
        >
          Back to home
        </Link>
      </div>
    </AppLayout>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? null;
  return { statusCode };
};

export default ErrorPage;
