import type { CalendarEvent } from "@/lib/calendar/get-calendar-events";

interface CalendarEventListProps {
  events: CalendarEvent[];
}

const KIND_STYLES: Record<CalendarEvent["kind"], string> = {
  session:
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  match:
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const KIND_LABELS: Record<CalendarEvent["kind"], string> = {
  session: "Training",
  match: "Match",
};

function formatDateHeading(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function groupByDate(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = groups.get(event.date) ?? [];
    list.push(event);
    groups.set(event.date, list);
  }
  return [...groups.entries()];
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={KIND_STYLES[event.kind]}>{KIND_LABELS[event.kind]}</span>
          <span className="truncate font-medium text-zinc-900 dark:text-zinc-50">
            {event.title}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {event.teamName}
          {event.startTime && ` · ${event.startTime.slice(0, 5)}`}
          {event.location && ` · ${event.location}`}
        </p>
      </div>
    </div>
  );
}

export default function CalendarEventList({ events }: CalendarEventListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No training sessions or matches scheduled yet.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today).reverse();

  const renderGroups = (list: CalendarEvent[]) =>
    groupByDate(list).map(([date, dayEvents]) => (
      <div key={date} className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {formatDateHeading(date)}
        </h3>
        {dayEvents.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    ));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No upcoming events.</p>
        ) : (
          renderGroups(upcoming)
        )}
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Past
          </h2>
          {renderGroups(past)}
        </section>
      )}
    </div>
  );
}
