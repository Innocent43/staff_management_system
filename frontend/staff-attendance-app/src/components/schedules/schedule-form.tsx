"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useSaveSchedule } from "@/hooks/use-schedules";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/errors";
import { WEEKDAYS } from "@/lib/weekdays";
import type { Schedule } from "@/types/schedule";

const schema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters").max(100),
  start_time: z.string().min(1, "Required"),
  end_time: z.string().min(1, "Required"),
  break_minutes: z.number().int().min(0, "Min 0").max(400, "Max 400"),
  grace_minutes: z.number().int().min(0, "Min 0").max(120, "Max 120"),
  workdays: z.array(z.number()).min(1, "Pick at least one day"),
});

type FormValues = z.infer<typeof schema>;

type Props = { schedule?: Schedule; onClose: () => void };

export function ScheduleForm({ schedule, onClose }: Props) {
  const save = useSaveSchedule(schedule);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: schedule?.name ?? "",
      start_time: schedule?.start_time.slice(0, 5) ?? "08:00",
      end_time: schedule?.end_time.slice(0, 5) ?? "17:00",
      break_minutes: schedule?.break_minutes ?? 0,
      grace_minutes: schedule?.grace_minutes ?? 0,
      workdays: schedule?.workdays ?? [0, 1, 2, 3, 4],
    },
  });

  // watch = read a field's live value so the day buttons can re-render
  const workdays = watch("workdays");

  function toggleDay(day: number) {
    const next = workdays.includes(day) ? workdays.filter((d) => d !== day) : [...workdays, day];
    setValue("workdays", next, { shouldValidate: true });
  }

  function onSubmit(values: FormValues) {
    save.mutate(values, { onSuccess: onClose });
  }

  return (
    <Modal title={schedule ? "Edit schedule" : "New schedule"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {save.error && <Alert>{getErrorMessage(save.error)}</Alert>}

        <Field label="Name" error={errors.name?.message}>
          <input className={INPUT_CLASS} {...register("name")} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start time" error={errors.start_time?.message}>
            <input type="time" className={INPUT_CLASS} {...register("start_time")} />
          </Field>
          <Field label="End time" error={errors.end_time?.message}>
            <input type="time" className={INPUT_CLASS} {...register("end_time")} />
          </Field>
          <Field label="Break (minutes)" error={errors.break_minutes?.message}>
            <input type="number" className={INPUT_CLASS} {...register("break_minutes", { valueAsNumber: true })} />
          </Field>
          <Field label="Grace (minutes)" error={errors.grace_minutes?.message}>
            <input type="number" className={INPUT_CLASS} {...register("grace_minutes", { valueAsNumber: true })} />
          </Field>
        </div>

        <div className="space-y-1">
          <span className="text-sm font-medium text-navy-700">Workdays</span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  workdays.includes(day.value)
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-navy-200 bg-white text-navy-700",
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
          {errors.workdays && <span className="block text-xs text-red-600">{errors.workdays.message}</span>}
        </div>

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save schedule"}
        </Button>
      </form>
    </Modal>
  );
}