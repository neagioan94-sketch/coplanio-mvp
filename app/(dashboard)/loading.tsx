export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-7 w-40 rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-72 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      <div className="mt-4 h-32 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
    </div>
  );
}
