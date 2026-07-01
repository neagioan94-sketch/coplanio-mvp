import type { SupabaseClient } from "@supabase/supabase-js";
import { getTrainingSessions } from "@/lib/training-sessions/get-training-sessions";
import { getMatches } from "@/lib/matches/get-matches";

export type CalendarEvent = {
  id: string; // `session-<uuid>` | `match-<uuid>` — stable, unique across kinds (used as ICS UID)
  kind: "session" | "match";
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM(:SS) for timed sessions; null for matches / untimed sessions
  durationMinutes: number | null;
  location: string | null;
  teamName: string;
  status: string;
};

/**
 * Merges the organization's training sessions and matches into one
 * chronological event list. Reuses the existing org-scoped getters
 * (getTrainingSessions / getMatches), which already filter deleted_at and
 * scope by organization_id via the RLS client. Cancelled events are dropped.
 */
export async function getCalendarEvents(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CalendarEvent[]> {
  const [sessions, matches] = await Promise.all([
    getTrainingSessions(supabase, organizationId),
    getMatches(supabase, organizationId),
  ]);

  const events: CalendarEvent[] = [];

  for (const s of sessions) {
    if (s.status === "cancelled") continue;
    events.push({
      id: `session-${s.id}`,
      kind: "session",
      title: s.title,
      date: s.sessionDate,
      startTime: s.startTime,
      durationMinutes: s.durationMinutes,
      location: s.location,
      teamName: s.teamName,
      status: s.status,
    });
  }

  for (const m of matches) {
    if (m.status === "cancelled") continue;
    events.push({
      id: `match-${m.id}`,
      kind: "match",
      title: `vs ${m.opponent}`,
      date: m.matchDate,
      startTime: null,
      durationMinutes: null,
      location: m.location,
      teamName: m.teamName,
      status: m.status,
    });
  }

  events.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const at = a.startTime ?? "";
    const bt = b.startTime ?? "";
    if (at !== bt) return at < bt ? -1 : 1;
    return 0;
  });

  return events;
}
