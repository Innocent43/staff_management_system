export function formatTime(iso: string | null, timeZone: string): string{
    if (!iso) return "-"

    return new Intl.DateTimeFormat("en-US",{
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone,
    }).format(new Date(iso))
}


export function formatDuration(totalMinutes: number): string{
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) return `${minutes} min`
    if (minutes === 0) return `${hours} h`

    return `${hours} h ${minutes} min`
}



export function formatDate(iso: string | null, timeZone: string): string {
  if (!iso) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | null, timeZone: string): string {
  if (!iso) return "-";
  return `${formatDate(iso, timeZone)}, ${formatTime(iso, timeZone)}`;
}




// Money arrives as text like "1500.00". Number() here is for DISPLAY only;
// never add or multiply these values in JavaScript.
export function formatMoney(amount: string, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
      Number(amount),
    );
  } catch {
    // Intl throws on an unknown currency code, so fall back to plain text
    return `${currency} ${amount}`;
  }
}

// "2026-11-01" is a calendar DAY, not a moment in time, so it must not be
// shifted by a timezone. We read the parts by hand and format as UTC.
export function formatDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date)));
}

export function formatPeriod(start: string, end: string): string {
  return `${formatDay(start)} to ${formatDay(end)}`;
}