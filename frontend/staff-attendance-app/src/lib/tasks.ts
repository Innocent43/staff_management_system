import type { TaskPriority, TaskStatus } from "@/types/task";

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

// A task is overdue when its deadline has passed and the work is not finished
export function isOverdue(deadline: string | null, finished: boolean): boolean {
  if (!deadline || finished) return false;
  return new Date(deadline) < new Date();
}