"use client";

import { ArrowRight } from "lucide-react";

import { useBusinessCurrency } from "@/hooks/use-business-currency";
import { useSchedules } from "@/hooks/use-schedules";
import { formatDay, formatMoney } from "@/lib/format";

function pretty(text: string): string {
  const spaced = text.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function Value({ field, value }: { field: string; value: unknown }) {
  const currency = useBusinessCurrency();
  const schedules = useSchedules();

  if (value === null || value === undefined || value === "") {
    return <span className="italic text-navy-400">empty</span>;
  }
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (field === "wage_rate") return <>{formatMoney(String(value), currency)}</>;
  if (field === "start_date") return <>{formatDay(String(value))}</>;
  if (field === "schedule_id") {
    const schedule = schedules.data?.find((item) => item.id === Number(value));
    return <>{schedule ? schedule.name : `#${value}`}</>;
  }
  if (typeof value === "object") return <>{JSON.stringify(value)}</>;
  return <>{pretty(String(value))}</>;
}

type Change = { old: unknown; new: unknown };

export function AuditDetails({ details }: { details: Record<string, unknown> }) {
  const { changes, ...rest } = details;
  const changed =
    changes && typeof changes === "object"
      ? Object.entries(changes as Record<string, Change>)
      : [];

  return (
    <div className="space-y-1.5 text-sm">
      {changed.map(([field, change]) => (
        <div key={field} className="flex flex-wrap items-center gap-x-2">
          <span className="font-medium text-navy-700">{pretty(field)}:</span>
          <span className="text-navy-500">
            <Value field={field} value={change.old} />
          </span>
          <ArrowRight className="size-3.5 text-navy-400" />
          <span className="font-medium text-navy-900">
            <Value field={field} value={change.new} />
          </span>
        </div>
      ))}

      {Object.entries(rest).map(([key, value]) => (
        <div key={key}>
          <span className="font-medium text-navy-700">{pretty(key)}: </span>
          <span className="text-navy-900">
            <Value field={key} value={value} />
          </span>
        </div>
      ))}
    </div>
  );
}