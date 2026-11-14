"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { INPUT_CLASS } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useAddComment } from "@/hooks/use-task-mutations";
import { useComments } from "@/hooks/use-tasks";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export function TaskComments({ taskId }: { taskId: number }) {
  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-navy-900">Comments</h2>
      <CommentList taskId={taskId} />
      <CommentForm taskId={taskId} />
    </section>
  );
}

function CommentList({ taskId }: { taskId: number }) {
  const timeZone = useBusinessTimezone();
  const { data, error, isPending, refetch } = useComments(taskId);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-20 w-full" />;
  if (data.length === 0) {
    return <EmptyState title="No comments yet" text="Start the conversation below." />;
  }

  return (
    <ul className="space-y-3">
      {data.map((comment) => (
        <li key={comment.id} className="rounded-lg border border-navy-100 bg-white p-3">
          <div className="flex items-center justify-between gap-2 text-xs text-navy-500">
            <span className="font-medium text-navy-800">{comment.author_name}</span>
            <span>{formatDateTime(comment.created_at, timeZone)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-navy-800">{comment.body}</p>
        </li>
      ))}
    </ul>
  );
}

const schema = z.object({
  body: z.string().trim().min(1, "Write something first").max(2000, "Max 2000 characters"),
});

type FormValues = z.infer<typeof schema>;

function CommentForm({ taskId }: { taskId: number }) {
  const add = useAddComment(taskId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { body: "" },
  });

  function onSubmit(values: FormValues) {
    // reset() empties the box, but only after the server accepted the comment
    add.mutate(values, { onSuccess: () => reset() });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      {add.error && <Alert>{getErrorMessage(add.error)}</Alert>}
      <textarea
        rows={3}
        placeholder="Write a comment"
        className={INPUT_CLASS}
        {...register("body")}
      />
      {errors.body && <span className="block text-xs text-red-600">{errors.body.message}</span>}
      <Button type="submit" disabled={add.isPending}>
        {add.isPending ? "Posting..." : "Post comment"}
      </Button>
    </form>
  );
}