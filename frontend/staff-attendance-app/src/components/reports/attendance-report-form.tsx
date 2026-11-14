"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useDownloadAttendanceReport } from "@/hooks/use-report-downloads";
import { toDateInput } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";

const schema = z
  .object({
    date_from: z.string().min(1, "Pick a start date"),
    date_to: z.string().min(1, "Pick an end date"),
    employee_id: z.string(), // "" means everyone
  })
  .refine((values) => values.date_to >= values.date_from, {
    message: "End date must not be before the start date",
    path: ["date_to"],
  });

type FormValues = z.infer<typeof schema>;

export function AttendanceReportForm() {
  const timeZone = useBusinessTimezone();
  const { people } = useEmployeeOptions();
  const download = useDownloadAttendanceReport();

  const today = toDateInput(new Date(), timeZone);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date_from: `${today.slice(0, 8)}01`, date_to: today, employee_id: "" },
  });

  function onSubmit(values: FormValues) {
    download.mutate({
      date_from: values.date_from,
      date_to: values.date_to,
      employee_id: values.employee_id ? Number(values.employee_id) : undefined,
    });
  }

  return (
    <Card>
      <h2 className="font-semibold text-navy-900">Attendance report</h2>
      <p className="mt-1 text-sm text-navy-600">
        Every clock-in and clock-out in the period you choose.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {download.error && <Alert>{getErrorMessage(download.error)}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From" error={errors.date_from?.message}>
            <input type="date" className={INPUT_CLASS} {...register("date_from")} />
          </Field>
          <Field label="To" error={errors.date_to?.message}>
            <input type="date" className={INPUT_CLASS} {...register("date_to")} />
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

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={download.isPending}>
            <Download className="size-4" />
            {download.isPending ? "Preparing..." : "Download CSV"}
          </Button>
          {download.isSuccess && <span className="text-sm text-emerald-700">Downloaded.</span>}
        </div>
      </form>
    </Card>
  );
}