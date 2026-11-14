"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { useDownloadPayReport } from "@/hooks/use-report-downloads";
import { getErrorMessage } from "@/lib/errors";

const schema = z
  .object({
    status: z.enum(["", "draft", "approved"]), // "" means any status
    employee_id: z.string(),
    date_from: z.string(), // "" means no limit
    date_to: z.string(),
  })
  // dates are optional here, so we only compare them when BOTH were filled in
  .refine((v) => !v.date_from || !v.date_to || v.date_to >= v.date_from, {
    message: "End date must not be before the start date",
    path: ["date_to"],
  });

type FormValues = z.infer<typeof schema>;

export function PayReportForm() {
  const { people } = useEmployeeOptions();
  const download = useDownloadPayReport();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "", employee_id: "", date_from: "", date_to: "" },
  });

  function onSubmit(values: FormValues) {
    download.mutate({
      status: values.status || undefined,
      employee_id: values.employee_id ? Number(values.employee_id) : undefined,
      date_from: values.date_from || undefined,
      date_to: values.date_to || undefined,
    });
  }

  return (
    <Card>
      <h2 className="font-semibold text-navy-900">Pay summaries report</h2>
      <p className="mt-1 text-sm text-navy-600">
        Pay summaries with their totals. Leave a filter empty to include everything.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {download.error && <Alert>{getErrorMessage(download.error)}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <select className={INPUT_CLASS} {...register("status")}>
              <option value="">Any status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
            </select>
          </Field>
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
          <Field label="From (optional)" error={errors.date_from?.message}>
            <input type="date" className={INPUT_CLASS} {...register("date_from")} />
          </Field>
          <Field label="To (optional)" error={errors.date_to?.message}>
            <input type="date" className={INPUT_CLASS} {...register("date_to")} />
          </Field>
        </div>

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