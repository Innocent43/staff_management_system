"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { EventTypeBadge } from "@/components/attendance/event-type-badge";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useVoidEvent } from "@/hooks/use-attendance-mutations";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import type { AttendanceEvent } from "@/types/attendance";

const schema = z.object({
  reason: z.string().trim().min(3, "Enter at least 3 characters").max(500, "Max 500 characters"),
});

type FormValues = z.infer<typeof schema>;

type Props = { event: AttendanceEvent; onClose: () => void };

export function VoidEventDialog({ event, onClose }: Props) {
  const timeZone = useBusinessTimezone();
  const { nameOf } = useEmployeeOptions();
  const voidEvent = useVoidEvent(event.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  function onSubmit(values: FormValues) {
    voidEvent.mutate({ reason: values.reason }, { onSuccess: onClose });
  }

  return (
    <Modal title="Void event" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-navy-600">
          <span className="font-medium text-navy-900">{nameOf(event.employee_id)}</span>
          <EventTypeBadge type={event.event_type} />
          <span>{formatDateTime(event.occurred_at, timeZone)}</span>
        </div>

        <p className="text-sm text-navy-600">
          A voided event no longer counts toward worked time or pay. It stays in the
          history so there is always a record of what happened.
        </p>

        {voidEvent.error && <Alert>{getErrorMessage(voidEvent.error)}</Alert>}

        <Field label="Reason" error={errors.reason?.message}>
          <textarea rows={3} className={INPUT_CLASS} {...register("reason")} />
        </Field>

        <Button type="submit" disabled={voidEvent.isPending}>
          {voidEvent.isPending ? "Voiding..." : "Void event"}
        </Button>
      </form>
    </Modal>
  );
}