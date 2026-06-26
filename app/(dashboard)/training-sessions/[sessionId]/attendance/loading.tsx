export default function AttendanceLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-8 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
