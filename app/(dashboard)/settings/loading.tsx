export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
