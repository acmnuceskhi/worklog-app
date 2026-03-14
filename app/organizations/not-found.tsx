import Link from "next/link";

export default function OrganizationNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg,#0f172a)]">
      <div className="text-center max-w-md px-6">
        <div className="text-7xl font-bold dark:text-white/20 text-gray-200 mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-2">
          Organization Not Found
        </h1>
        <p className="dark:text-white/60 text-gray-500 mb-6 text-sm">
          This organization doesn&rsquo;t exist or you don&rsquo;t have access
          to it.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/teams/organisations"
            className="inline-flex items-center justify-center rounded-md border dark:border-white/20 border-gray-300 px-4 py-2 text-sm dark:text-white/80 text-gray-700 transition-colors dark:hover:bg-white/10 hover:bg-gray-200"
          >
            My Organizations
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center justify-center rounded-md bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-500"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
