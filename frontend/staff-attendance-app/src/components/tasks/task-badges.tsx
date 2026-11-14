"use client";

import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { isOverdue, PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/lib/tasks";
import type { TaskPriority, TaskStatus } from "@/types/task";

const PILL = "rounded-full px-2.5 py-1 text-xs font-medium";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-navy-100 text-navy-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: "bg-navy-100 text-navy-700",
  in_progress: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const label = PRIORITY_OPTIONS.find((option) => option.value === priority)?.label;
  return <span className={cn(PILL, PRIORITY_STYLES[priority])}>{label ?? priority}</span>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const label = STATUS_OPTIONS.find((option) => option.value === status)?.label;
  return <span className={cn(PILL, STATUS_STYLES[status])}>{label ?? status}</span>;
}

type DeadlineProps = { deadline: string | null; finished: boolean };

export function DeadlineText({ deadline, finished }: DeadlineProps) {
  const timeZone = useBusinessTimezone();

  if (!deadline) return <span className="text-navy-400">No deadline</span>;

  const late = isOverdue(deadline, finished);
  return (
    <span className={cn(late && "font-medium text-red-600")}>
      {formatDateTime(deadline, timeZone)}
      {late && " · Overdue"}
    </span>
  );
}