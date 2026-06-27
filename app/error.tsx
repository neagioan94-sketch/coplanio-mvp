"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Something went wrong
      </p>
      <button
        onClick={reset}
        className="text-sm text-zinc-500 underline underline-offset-4 dark:text-zinc-400"
      >
        Try again
      </button>
    </div>
  );
}
