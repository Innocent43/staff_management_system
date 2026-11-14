// Date as "2026-11-08", read from a wall clock in the business's timezone.
// "en-CA" is used because that locale prints YYYY-MM-DD, which is the exact
// format <input type="date"> and the backend expect.
export function toDateInput(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function pad(value: number): string {
  return String(value).padStart(2, "0"); // 5 -> "05"
}

// Backend ISO text -> "2026-11-08T09:30", the format <input type="datetime-local"> needs
export function toDateTimeInput(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(" ", "T");
}


// "2026-11-08T09:30" typed in the business's timezone -> real UTC instant for the backend
export function fromDateTimeInput(value: string, timeZone: string): string {
  const asIfUtc = new Date(`${value}:00Z`); // pretend the typed time is UTC
  const shown = toDateTimeInput(asIfUtc.toISOString(), timeZone); // what the business clock shows then
  const offset = new Date(`${shown}:00Z`).getTime() - asIfUtc.getTime(); // the gap between the two
  return new Date(asIfUtc.getTime() - offset).toISOString();
}