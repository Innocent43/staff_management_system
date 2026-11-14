"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { DeadlineText, PriorityBadge, TaskStatusBadge } from "@/components/tasks/task-badges";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskForm } from "@/components/tasks/task-form";
import { Alert } from "@/components/ui/alert";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TableShell } from "@/components/ui/table";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useDeleteTask } from "@/hooks/use-task-mutations";
import { useTask } from "@/hooks/use-tasks";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

const SMALL_BUTTON =
  "inline-flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-navy-700 hover:bg-navy-50 disabled:opacity-50";

export function TaskDetail({ id }: { id: number }) {
  const router = useRouter();
  const timeZone = useBusinessTimezone();
  const [editing, setEditing] = useState(false);
  const remove = useDeleteTask();
  const { data, error, isPending, refetch } = useTask(id);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;

  const finished = data.assignments.length > 0 && data.assignments.every((a) => a.status === "completed");

  function handleDelete() {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    remove.mutate(id, { onSuccess: () => router.push("/dashboard/tasks") });
  }

  return (
    <div className="space-y-6">
      {remove.error && <Alert>{getErrorMessage(remove.error)}</Alert>}

      <div className="space-y-3 rounded-xl border border-navy-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-navy-900">{data.title}</h1>
          <div className="flex gap-2">
            <button className={SMALL_BUTTON} onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit
            </button>
            <button className={SMALL_BUTTON} disabled={remove.isPending} onClick={handleDelete}>
              <Trash2 className="size-4" /> Delete
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-navy-600">
          <PriorityBadge priority={data.priority} />
          <DeadlineText deadline={data.deadline} finished={finished} />
          <span className="text-navy-400">Created {formatDateTime(data.created_at, timeZone)}</span>
        </div>

        {data.description && (
          <p className="whitespace-pre-wrap text-sm text-navy-800">{data.description}</p>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold text-navy-900">Assignees</h2>
        <TableShell columns={["Employee", "Status", "Completed"]}>
          {data.assignments.map((assignment) => (
            <tr key={assignment.id} className="border-t border-navy-100">
              <td className="px-4 py-3 font-medium text-navy-900">{assignment.employee_name}</td>
              <td className="px-4 py-3">
                <TaskStatusBadge status={assignment.status} />
              </td>
              <td className="px-4 py-3">{formatDateTime(assignment.completed_at, timeZone)}</td>
            </tr>
          ))}
        </TableShell>
      </section>

      <TaskComments taskId={id} />

      {editing && <TaskForm task={data} onClose={() => setEditing(false)} />}
    </div>
  );
}