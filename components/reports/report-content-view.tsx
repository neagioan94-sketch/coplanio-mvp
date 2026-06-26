interface ReportContentViewProps {
  content: Record<string, unknown> | null;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatKey(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ReportContentView({ content }: ReportContentViewProps) {
  if (!content || Object.keys(content).length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No structured content available.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {Object.entries(content).map(([key, value]) => (
          <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
            <td className="py-2 pr-4 font-medium text-zinc-700 dark:text-zinc-300 w-40">
              {formatKey(key)}
            </td>
            <td className="py-2 text-zinc-600 dark:text-zinc-400">{formatValue(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
