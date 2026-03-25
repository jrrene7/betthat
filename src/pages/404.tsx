import Link from "next/link";
import AppLayout from "src/layouts/AppLayout";

export default function NotFoundPage() {
  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-61px)] w-full flex-col items-center justify-center px-4 text-center">
        <p className="text-8xl font-bold text-primary opacity-80">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
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
