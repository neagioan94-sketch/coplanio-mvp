import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { getActiveOrganization } from "@/lib/organizations/get-organization";
import { getCalendarEvents } from "@/lib/calendar/get-calendar-events";
import CalendarEventList from "@/components/calendar/calendar-event-list";

export default async function CalendarPage() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const activeOrg = await getActiveOrganization(supabase, user.id);
  if (!activeOrg) redirect("/setup/organization");

  const events = await getCalendarEvents(supabase, activeOrg.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Training sessions and matches across your organization.
          </p>
        </div>
        <a
          href="/calendar/export"
          className="self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:self-auto"
        >
          Export to calendar (.ics)
        </a>
      </div>

      <CalendarEventList events={events} />
    </div>
  );
}
