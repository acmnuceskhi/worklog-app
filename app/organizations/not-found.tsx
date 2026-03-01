import Link from "next/link";

export default function OrganizationNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg,#0f172a)]">
      <div className="text-center max-w-md px-6">
        <div className="text-7xl font-bold text-white/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Organization Not Found
        </h1>
        <p className="text-white/60 mb-6 text-sm">
          This organization doesn&rsquo;t exist or you don&rsquo;t have access
          to it.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/teams/organisations"
            className="inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
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
