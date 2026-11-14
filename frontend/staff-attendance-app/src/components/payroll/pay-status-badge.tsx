import { cn } from "@/lib/cn";
import type { PayStatus } from "@/types/payroll";

export function PayStatusBadge({ status }: { status: PayStatus }) {
  const approved = status === "approved";

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
      )}
    >
      {approved ? "Approved" : "Draft"}
    </span>
  );
}