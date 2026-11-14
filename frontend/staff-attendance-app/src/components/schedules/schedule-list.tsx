"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Alert } from "../ui/alert";
import { EmptyState } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";
import { Skeleton } from "../ui/skeleton";
import { useDeleteSchedule, useSchedules } from "@/hooks/use-schedules";
import { getErrorMessage } from "@/lib/errors";
import { formatDuration } from "@/lib/format";
import { WEEKDAYS } from "@/lib/weekdays";
import type { Schedule } from "@/types/schedule";

export function ScheduleList({ onEdit }: { onEdit: (schedule: Schedule) => void }) {
  const { data, error, isPending, refetch } = useSchedules();
  const remove = useDeleteSchedule();

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-32 w-full" />;
  if (data.length === 0) {
    return <EmptyState title="No schedules yet" text="Create one to assign it to employees." />;
  }

  function handleDelete(schedule: Schedule) {
    if (window.confirm(`Delete "${schedule.name}"?`)) remove.mutate(schedule.id);
  }

  return (
    <div className="space-y-3">
      {remove.error && <Alert>{getErrorMessage(remove.error)}</Alert>}
      {data.map((schedule) => (
        <div key={schedule.id} className="flex items-center justify-between rounded-xl border border-navy-200 bg-white p-4">
          <div className="space-y-1">
            <p className="font-medium text-navy-900">{schedule.name}</p>
            <p className="text-sm text-navy-600">
              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} · break{" "}
              {formatDuration(schedule.break_minutes)} · grace {formatDuration(schedule.grace_minutes)}
            </p>
            <p className="text-sm text-navy-500">
              {WEEKDAYS.filter((d) => schedule.workdays.includes(d.value))
                .map((d) => d.label)
                .join(", ")}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(schedule)} aria-label="Edit" className="rounded-lg p-2 text-navy-600 hover:bg-navy-50">
              <Pencil className="size-4" />
            </button>
            <button onClick={() => handleDelete(schedule)} aria-label="Delete" className="rounded-lg p-2 text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}