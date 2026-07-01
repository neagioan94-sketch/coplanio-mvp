import type { CalendarEvent } from "@/lib/calendar/get-calendar-events";

/** Escapes text for an ICS property value per RFC 5545 (backslash, semicolon, comma, newline). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toIcsDate(date: string): string {
  // "YYYY-MM-DD" -> "YYYYMMDD"
  return date.replace(/-/g, "");
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return toIcsDate(d.toISOString().slice(0, 10));
}

function toIcsLocalDateTime(date: string, time: string): string {
  // Floating local time (no Z, no TZID): "YYYYMMDDTHHMMSS"
  const [h = "00", m = "00", s = "00"] = time.split(":");
  return `${toIcsDate(date)}T${h.padStart(2, "0")}${m.padStart(2, "0")}${s.padStart(2, "0")}`;
}

function addMinutesLocal(date: string, time: string, minutes: number): string {
  const [h = "0", m = "0", s = "0"] = time.split(":").map((p) => p);
  const d = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(h),
    Number(m),
    Number(s),
  );
  d.setMinutes(d.getMinutes() + minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function dtstamp(): string {
  // UTC timestamp for DTSTAMP: "YYYYMMDDTHHMMSSZ"
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildVevent(event: CalendarEvent, stamp: string): string {
  const lines: string[] = ["BEGIN:VEVENT", `UID:${event.id}@coplanio`, `DTSTAMP:${stamp}`];

  if (event.startTime) {
    const duration = event.durationMinutes && event.durationMinutes > 0 ? event.durationMinutes : 60;
    lines.push(`DTSTART:${toIcsLocalDateTime(event.date, event.startTime)}`);
    lines.push(`DTEND:${addMinutesLocal(event.date, event.startTime, duration)}`);
  } else {
    // All-day event (matches, or sessions without a start time).
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(event.date)}`);
    lines.push(`DTEND;VALUE=DATE:${nextDay(event.date)}`);
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);

  const kindLabel = event.kind === "match" ? "Match" : "Training session";
  const description = `${kindLabel} — ${event.teamName}${event.status ? ` (${event.status})` : ""}`;
  lines.push(`DESCRIPTION:${escapeIcsText(description)}`);

  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

export function buildIcsCalendar(events: CalendarEvent[], calendarName: string): string {
  const stamp = dtstamp();
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coplanio//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ].join("\r\n");

  const body = events.map((e) => buildVevent(e, stamp)).join("\r\n");

  return `${header}\r\n${body}${body ? "\r\n" : ""}END:VCALENDAR\r\n`;
}
