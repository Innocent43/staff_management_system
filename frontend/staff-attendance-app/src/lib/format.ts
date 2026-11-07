export function formatTime(iso: string | null, timeZone: string): string{
    if (!iso) return "-"

    return new Intl.DateTimeFormat("en-GB",{
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
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