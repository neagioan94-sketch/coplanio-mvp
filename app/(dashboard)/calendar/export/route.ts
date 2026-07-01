import { createClient } from "@/lib/db/supabase-server";
import { requireUser } from "@/lib/auth/get-user";
import { requireActiveOrganization } from "@/lib/organizations/get-organization";
import { createAuditEvent } from "@/lib/audit/create-audit-event";
import { getCalendarEvents } from "@/lib/calendar/get-calendar-events";
import { buildIcsCalendar } from "@/lib/calendar/build-ics";

export async function GET() {
  const user = await requireUser();
  const supabase = await createClient();
  if (!supabase) return new Response("Service unavailable", { status: 503 });

  const activeOrg = await requireActiveOrganization(supabase, user.id);
  const { organizationId } = activeOrg;

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  const events = await getCalendarEvents(supabase, organizationId);
  const ics = buildIcsCalendar(events, `${org?.name ?? "Coplanio"} calendar`);

  await createAuditEvent(supabase, {
    organizationId,
    actorUserId: user.id,
    actionType: "calendar.exported",
    targetType: "organization",
    targetId: organizationId,
    newValue: { event_count: events.length },
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="coplanio-calendar.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
