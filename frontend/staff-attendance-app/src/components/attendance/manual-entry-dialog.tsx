"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useAddManualEvent } from "@/hooks/use-attendance-mutations";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { fromDateTimeInput, toDateTimeInput } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";

const schema = z.object({
  employee_id: z.string().min(1, "Choose an employee"), // a <select> always gives text
  event_type: z.enum(["clock_in", "clock_out"]),
  occurred_at: z.string().min(1, "Pick a date and time"),
  reason: z.string().trim().min(3, "Enter at least 3 characters").max(500, "Max 500 characters"),
});

type FormValues = z.infer<typeof schema>;

export function ManualEntryDialog({ onClose }: { onClose: () => void }) {
  const add = useAddManualEvent();
  const { people } = useEmployeeOptions();
  const timezone = useBusinessTimezone()
  const activePeople = people.filter((person) => person.status === "active");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_id: "",
      event_type: "clock_in",
      occurred_at: toDateTimeInput(new Date().toISOString(),timezone), // right now
      reason: "",
    },
  });

  function onSubmit(values: FormValues) {
    add.mutate(
      {
        employee_id: Number(values.employee_id),
        event_type: values.event_type,
        occurred_at: fromDateTimeInput(values.occurred_at,timezone),
        reason: values.reason,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal title="Add attendance entry" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {add.error && <Alert>{getErrorMessage(add.error)}</Alert>}

        <Field label="Employee" error={errors.employee_id?.message}>
          <select className={INPUT_CLASS} {...register("employee_id")}>
            <option value="">Choose...</option>
            {activePeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.user.full_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Type">
          <select className={INPUT_CLASS} {...register("event_type")}>
            <option value="clock_in">Clock in</option>
            <option value="clock_out">Clock out</option>
          </select>
        </Field>

        <Field label="Date and time" error={errors.occurred_at?.message}>
          <input type="datetime-local" className={INPUT_CLASS} {...register("occurred_at")} />
        </Field>

        <Field label="Reason" error={errors.reason?.message}>
          <textarea
            rows={3}
            className={INPUT_CLASS}
            placeholder="e.g. Phone battery died, supervisor confirmed arrival"
            {...register("reason")}
          />
        </Field>

        <Button type="submit" disabled={add.isPending}>
          {add.isPending ? "Saving..." : "Add entry"}
        </Button>
      </form>
    </Modal>
  );
}