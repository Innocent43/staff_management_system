import { cn } from "@/lib/cn";
import type { EventType } from "@/types/attendance";

export function EventTypeBadge({ type }: { type: EventType }) {
  const isIn = type === "clock_in";

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        isIn ? "bg-emerald-100 text-emerald-800" : "bg-navy-100 text-navy-700",
      )}
    >
      {isIn ? "Clock in" : "Clock out"}
    </span>
  );
}