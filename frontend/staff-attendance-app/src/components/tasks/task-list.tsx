"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { DeadlineText, PriorityBadge } from "@/components/tasks/task-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { INPUT_CLASS } from "@/components/ui/field";
import { Pager } from "@/components/ui/pager";
import { Skeleton } from "@/components/ui/skeleton";
import { TableShell } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useTasks } from "@/hooks/use-tasks";
import { pageParams, splitPage } from "@/lib/pagination";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/lib/tasks";
import type { TaskListParams, TaskPriority, TaskStatus } from "@/types/task";

type Filters = {
  searchText: string;
  status: TaskStatus | "";
  priority: TaskPriority | "";
  employeeId: string; // "" means everyone
  overdue: boolean;
};

export function TaskList() {
  const { people } = useEmployeeOptions();

  const [filters, setFilters] = useState<Filters>({
    searchText: "",
    status: "",
    priority: "",
    employeeId: "",
    overdue: false,
  });
  const [page, setPage] = useState(0);

  // typing updates searchText instantly; the API only sees `search` after a pause
  const search = useDebouncedValue(filters.searchText.trim());

  function updateFilters(changes: Partial<Filters>) {
    setFilters((previous) => ({ ...previous, ...changes }));
    setPage(0);
  }

  // "x || undefined" turns an empty filter into undefined, and buildQuery skips undefined
  const params: TaskListParams = {
    search: search || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    employee_id: filters.employeeId ? Number(filters.employeeId) : undefined,
    overdue: filters.overdue || undefined,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
          <input
            value={filters.searchText}
            onChange={(e) => updateFilters({ searchText: e.target.value })}
            placeholder="Search tasks"
            maxLength={100}
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>

        <div className="w-40">
          <select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value as TaskStatus | "" })}
            className={INPUT_CLASS}
          >
            <option value="">Any status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <select
            value={filters.priority}
            onChange={(e) => updateFilters({ priority: e.target.value as TaskPriority | "" })}
            className={INPUT_CLASS}
          >
            <option value="">Any priority</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <select
            value={filters.employeeId}
            onChange={(e) => updateFilters({ employeeId: e.target.value })}
            className={INPUT_CLASS}
          >
            <option value="">Everyone</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.user.full_name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            checked={filters.overdue}
            onChange={(e) => updateFilters({ overdue: e.target.checked })}
          />
          Overdue only
        </label>
      </div>

      <TaskTable params={params} page={page} onPageChange={setPage} />
    </div>
  );
}

type TableProps = {
  params: TaskListParams;
  page: number;
  onPageChange: (page: number) => void;
};

function TaskTable({ params, page, onPageChange }: TableProps) {
  const { data, error, isPending, isPlaceholderData, refetch } = useTasks({
    ...params,
    ...pageParams(page),
  });

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;

  const { rows, hasNext } = splitPage(data);

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <EmptyState title="No tasks found" text="Try different filters, or create a new task." />
      ) : (
        <TableShell
          columns={["Task", "Priority", "Deadline", "Assigned to"]}
          dimmed={isPlaceholderData}
        >
          {rows.map((task) => {
            const total = task.assignments.length;
            const done = task.assignments.filter((a) => a.status === "completed").length;

            return (
              <tr key={task.id} className="border-t border-navy-100">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="font-medium text-navy-900 hover:underline"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3">
                  <DeadlineText deadline={task.deadline} finished={total > 0 && done === total} />
                </td>
                <td className="px-4 py-3">
                  <p>
                    {done} of {total} done
                  </p>
                  <p className="max-w-xs truncate text-navy-500">
                    {task.assignments.map((a) => a.employee_name).join(", ")}
                  </p>
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}

      <Pager page={page} hasNext={hasNext} onChange={onPageChange} />
    </div>
  );
}