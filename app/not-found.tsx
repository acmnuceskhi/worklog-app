import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg,#0f172a)]">
      <div className="text-center max-w-md px-6">
        <div className="text-7xl font-bold dark:text-white/20 text-gray-200 mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">
          Page Not Found
        </h1>
        <p className="dark:text-white/60 text-gray-500 mb-6 text-sm">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been
          moved.
        </p>
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-md bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-500"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
