"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { EventTypeBadge } from "@/components/attendance/event-type-badge";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useCorrectEvent } from "@/hooks/use-attendance-mutations";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { fromDateTimeInput, toDateTimeInput } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import type { AttendanceEvent } from "@/types/attendance";

const schema = z.object({
  occurred_at: z.string().min(1, "Pick a date and time"),
  reason: z.string().trim().min(3, "Enter at least 3 characters").max(500, "Max 500 characters"),
});

type FormValues = z.infer<typeof schema>;

type Props = { event: AttendanceEvent; onClose: () => void };

export function CorrectEventDialog({ event, onClose }: Props) {
  const timeZone = useBusinessTimezone();
  const { nameOf } = useEmployeeOptions();
  const correct = useCorrectEvent(event.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { occurred_at: toDateTimeInput(event.occurred_at,timeZone), reason: "" },
  });

  function onSubmit(values: FormValues) {
    correct.mutate(
      { occurred_at: fromDateTimeInput(values.occurred_at,timeZone), reason: values.reason },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal title="Correct time" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-navy-600">
          <span className="font-medium text-navy-900">{nameOf(event.employee_id)}</span>
          <EventTypeBadge type={event.event_type} />
          <span>currently {formatDateTime(event.occurred_at, timeZone)}</span>
        </div>

        {correct.error && <Alert>{getErrorMessage(correct.error)}</Alert>}

        <Field label="Correct date and time" error={errors.occurred_at?.message}>
          <input type="datetime-local" className={INPUT_CLASS} {...register("occurred_at")} />
        </Field>

        <Field label="Reason" error={errors.reason?.message}>
          <textarea rows={3} className={INPUT_CLASS} {...register("reason")} />
        </Field>

        <Button type="submit" disabled={correct.isPending}>
          {correct.isPending ? "Saving..." : "Save correction"}
        </Button>
      </form>
    </Modal>
  );
}