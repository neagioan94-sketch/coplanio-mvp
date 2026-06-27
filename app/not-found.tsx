import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-4 text-center dark:bg-zinc-950">
      <p className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">404</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Page not found.</p>
      <Link
        href="/dashboard"
        className="text-sm text-zinc-700 underline underline-offset-4 dark:text-zinc-300"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
