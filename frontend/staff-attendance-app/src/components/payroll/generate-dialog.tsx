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
import { useGenerateSummaries } from "@/hooks/use-payroll-mutations";
import { toDateInput } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";

const schema = z
  .object({
    period_start: z.string().min(1, "Pick a start date"),
    period_end: z.string().min(1, "Pick an end date"),
    employee_id: z.string(), // "" means everyone
  })
  // A rule that compares two fields lives on the whole object, and `path`
  // says which field shows the error. "YYYY-MM-DD" text compares correctly as text.
  .refine((values) => values.period_end >= values.period_start, {
    message: "End date must not be before the start date",
    path: ["period_end"],
  });

type FormValues = z.infer<typeof schema>;

export function GenerateDialog({ onClose }: { onClose: () => void }) {
  const timeZone = useBusinessTimezone();
  const { people } = useEmployeeOptions();
  const generate = useGenerateSummaries();

  const today = toDateInput(new Date(), timeZone); // "2026-11-11"

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      period_start: `${today.slice(0, 8)}01`, // first day of this month: "2026-11-" + "01"
      period_end: today,
      employee_id: "",
    },
  });

  function onSubmit(values: FormValues) {
    generate.mutate({
      period_start: values.period_start,
      period_end: values.period_end,
      employee_id: values.employee_id ? Number(values.employee_id) : null,
    });
  }

  // Second screen: the result. All hooks above ran already, so returning here is safe.
  if (generate.isSuccess) {
    const { summaries, skipped } = generate.data;

    return (
      <Modal title="Payroll generated" onClose={onClose}>
        <div className="space-y-4">
          <p className="text-sm text-navy-800">
            Generated <b>{summaries.length}</b> pay {summaries.length === 1 ? "summary" : "summaries"}.
          </p>

          {skipped.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800">Skipped ({skipped.length})</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-navy-700">
                {skipped.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={onClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Generate payroll" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {generate.error && <Alert>{getErrorMessage(generate.error)}</Alert>}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Period start" error={errors.period_start?.message}>
            <input type="date" className={INPUT_CLASS} {...register("period_start")} />
          </Field>
          <Field label="Period end" error={errors.period_end?.message}>
            <input type="date" className={INPUT_CLASS} {...register("period_end")} />
          </Field>
        </div>

        <Field label="Employee">
          <select className={INPUT_CLASS} {...register("employee_id")}>
            <option value="">Everyone</option>
            {people
              .filter((person) => person.status !== "invited")
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.user.full_name}
                </option>
              ))}
          </select>
        </Field>

        <Button type="submit" disabled={generate.isPending}>
          {generate.isPending ? "Generating..." : "Generate"}
        </Button>
      </form>
    </Modal>
  );
}