"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

import { DeadlineText, PriorityBadge } from "@/components/tasks/task-badges";
import { TaskComments } from "@/components/tasks/task-comments";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { Pager } from "@/components/ui/pager";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useUpdateMyStatus } from "@/hooks/use-task-mutations";
import { useMyTasks } from "@/hooks/use-tasks";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { pageParams, splitPage } from "@/lib/pagination";
import { STATUS_OPTIONS } from "@/lib/tasks";
import type { MyTask, TaskStatus } from "@/types/task";

type StatusTab = TaskStatus | "all";

const TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  ...STATUS_OPTIONS, // spread: copy the three status options into this list
];

export function MyTasks() {
  const [tab, setTab] = useState<StatusTab>("all");
  const [page, setPage] = useState(0);
  const [commentsFor, setCommentsFor] = useState<MyTask | null>(null);

  function handleTabChange(value: StatusTab) {
    setTab(value);
    setPage(0);
  }

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} active={tab} onChange={handleTabChange} />

      <MyTaskCards
        status={tab === "all" ? undefined : tab}
        page={page}
        onPageChange={setPage}
        onOpenComments={setCommentsFor}
      />

      {commentsFor && (
        <Modal title={commentsFor.title} onClose={() => setCommentsFor(null)}>
          <TaskComments taskId={commentsFor.task_id} />
        </Modal>
      )}
    </div>
  );
}

type CardsProps = {
  status?: TaskStatus;
  page: number;
  onPageChange: (page: number) => void;
  onOpenComments: (task: MyTask) => void;
};

function MyTaskCards({ status, page, onPageChange, onOpenComments }: CardsProps) {
  const { data, error, isPending, isPlaceholderData, refetch } = useMyTasks({
    status,
    ...pageParams(page),
  });

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-40 w-full" />;

  const { rows, hasNext } = splitPage(data);

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <EmptyState title="No tasks here" text="Tasks assigned to you will appear in this list." />
      ) : (
        <ul className={cn("space-y-3", isPlaceholderData && "opacity-60")}>
          {rows.map((task) => (
            <MyTaskCard key={task.task_id} task={task} onOpenComments={onOpenComments} />
          ))}
        </ul>
      )}

      <Pager page={page} hasNext={hasNext} onChange={onPageChange} />
    </div>
  );
}

type CardProps = { task: MyTask; onOpenComments: (task: MyTask) => void };

function MyTaskCard({ task, onOpenComments }: CardProps) {
  const timeZone = useBusinessTimezone();
  const update = useUpdateMyStatus(); // each card tracks its own request and error

  return (
    <li className="space-y-3 rounded-xl border border-navy-200 bg-white p-4">
      {update.error && <Alert>{getErrorMessage(update.error)}</Alert>}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-medium text-navy-900">{task.title}</h2>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="whitespace-pre-wrap text-sm text-navy-700">{task.description}</p>
      )}

      <p className="text-sm text-navy-600">
        <DeadlineText deadline={task.deadline} finished={task.status === "completed"} />
        {task.completed_at && (
          <span className="text-emerald-700">
            {" "}
            · Completed {formatDateTime(task.completed_at, timeZone)}
          </span>
        )}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isCurrent = task.status === option.value;
            return (
              <button
                key={option.value}
                disabled={update.isPending || isCurrent}
                onClick={() => update.mutate({ taskId: task.task_id, status: option.value })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  isCurrent
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-navy-200 text-navy-700 hover:bg-navy-50 disabled:opacity-50",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onOpenComments(task)}
          className="inline-flex items-center gap-1 text-sm text-navy-600 hover:underline"
        >
          <MessageSquare className="size-4" /> Comments
        </button>
      </div>
    </li>
  );
}