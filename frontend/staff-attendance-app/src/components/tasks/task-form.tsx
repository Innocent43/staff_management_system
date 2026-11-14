"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useSaveTask } from "@/hooks/use-task-mutations";
import { fromDateTimeInput, toDateTimeInput } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { PRIORITY_OPTIONS } from "@/lib/tasks";
import type { Task } from "@/types/task";

const schema = z.object({
  title: z.string().trim().min(2, "Enter at least 2 characters").max(200, "Max 200 characters"),
  description: z.string().trim().max(2000, "Max 2000 characters"),
  deadline: z.string(), // "" means no deadline
  priority: z.enum(["low", "medium", "high"]),
  assignee_ids: z
    .array(z.number())
    .min(1, "Pick at least one person")
    .max(50, "Max 50 people"),
});

type FormValues = z.infer<typeof schema>;

type Props = { task?: Task; onClose: () => void };

export function TaskForm({ task, onClose }: Props) {
  const timeZone = useBusinessTimezone();
  const { people } = useEmployeeOptions();
  const save = useSaveTask(task);

  const activePeople = people.filter((person) => person.status === "active");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      deadline: task?.deadline ? toDateTimeInput(task.deadline, timeZone) : "",
      priority: task?.priority ?? "medium",
      assignee_ids: task?.assignments.map((a) => a.employee_id) ?? [],
    },
  });

  // same technique as the workdays buttons in the schedule form
  const assigneeIds = watch("assignee_ids");

  function toggleAssignee(id: number) {
    const next = assigneeIds.includes(id)
      ? assigneeIds.filter((existing) => existing !== id)
      : [...assigneeIds, id];
    setValue("assignee_ids", next, { shouldValidate: true });
  }

  function onSubmit(values: FormValues) {
    save.mutate(
      {
        title: values.title,
        description: values.description || null,
        deadline: values.deadline ? fromDateTimeInput(values.deadline, timeZone) : null,
        priority: values.priority,
        assignee_ids: values.assignee_ids,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {save.error && <Alert>{getErrorMessage(save.error)}</Alert>}

        <Field label="Title" error={errors.title?.message}>
          <input className={INPUT_CLASS} {...register("title")} />
        </Field>

        <Field label="Description (optional)" error={errors.description?.message}>
          <textarea rows={3} className={INPUT_CLASS} {...register("description")} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Deadline (optional)" error={errors.deadline?.message}>
            <input type="datetime-local" className={INPUT_CLASS} {...register("deadline")} />
          </Field>
          <Field label="Priority">
            <select className={INPUT_CLASS} {...register("priority")}>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium text-navy-700">Assign to</span>
          <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-navy-200 p-2">
            {activePeople.map((person) => (
              <label key={person.id} className="flex items-center gap-2 text-sm text-navy-800">
                <input
                  type="checkbox"
                  checked={assigneeIds.includes(person.id)}
                  onChange={() => toggleAssignee(person.id)}
                />
                {person.user.full_name}
                <span className="text-navy-400 capitalize">({person.role})</span>
              </label>
            ))}
          </div>
          {errors.assignee_ids && (
            <span className="block text-xs text-red-600">{errors.assignee_ids.message}</span>
          )}
        </div>

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save task"}
        </Button>
      </form>
    </Modal>
  );
}