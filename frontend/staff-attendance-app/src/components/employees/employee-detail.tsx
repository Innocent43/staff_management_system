"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { ErrorState } from "../ui/error-state";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Skeleton } from "../ui/skeleton";
import { useEmployee } from "@/hooks/use-employees";
import {
  useDeactivateEmployee,
  useReactivateEmployee,
  useUpdateEmployee,
} from "@/hooks/use-employee-mutations";
import { useSchedules } from "@/hooks/use-schedules";
import { getErrorMessage } from "@/lib/errors";
import type { Employee } from "@/types/employee";

export function EmployeeDetail({ id }: { id: number }) {
  const { data, error, isPending, refetch } = useEmployee(id);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <Header employee={data} />
      <EmployeeForm employee={data} />
    </div>
  );
}

function Header({ employee }: { employee: Employee }) {
  const deactivate = useDeactivateEmployee();
  const reactivate = useReactivateEmployee();
  const active = employee.status === "active";
  const mutation = active ? deactivate : reactivate;

  function handleToggle() {
    if (active && !window.confirm("Deactivate this employee? They will lose access.")) return;
    mutation.mutate(employee.id);
  }

  return (
    <div className="space-y-3">
      {mutation.error && <Alert>{getErrorMessage(mutation.error)}</Alert>}
      <div className="flex gap-4 items-start justify-between rounded-xl border border-navy-200 bg-white p-4 sm:items-center">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div>
            <h1 className="text-xl font-semibold text-navy-900 break-words line-clamp-2">
              {employee.user.full_name}
            </h1>
            <p className="text-sm text-navy-500 break-all">
              {employee.user.email}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="inline-flex items-center rounded-md bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700 border border-navy-100 capitalize">
              {employee.role}
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border capitalize ${
              active 
                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                : "bg-amber-50 text-amber-700 border-amber-100"
            }`}>
              {employee.status}
            </span>
          </div>
        </div>

        {employee.status !== "invited" && (
          <div className="flex-shrink-0 self-center sm:self-auto">
            <Button onClick={handleToggle} disabled={mutation.isPending}>
              {active ? "Deactivate" : "Reactivate"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

}

const schema = z.object({
  staff_code: z.string().trim().max(30, "Max 30 characters"),
  start_date: z.string(),
  schedule_id: z.string(), // <select> values are always strings; "" means none
  wage_type: z.enum(["hourly", "daily", "fixed"]),
  wage_rate: z
    .string()
    .refine((v) => v.trim() !== "" && !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid amount"),
});

type FormValues = z.infer<typeof schema>;

function EmployeeForm({ employee }: { employee: Employee }) {
  const update = useUpdateEmployee(employee.id);
  const schedules = useSchedules();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      staff_code: employee.staff_code ?? "",
      start_date: employee.start_date ?? "",
      schedule_id: employee.schedule_id?.toString() ?? "",
      wage_type: employee.wage_type,
      wage_rate: employee.wage_rate,
    },
  });

  function onSubmit(values: FormValues) {
    update.mutate({
      staff_code: values.staff_code || null,
      start_date: values.start_date || null,
      schedule_id: values.schedule_id ? Number(values.schedule_id) : null,
      wage_type: values.wage_type,
      wage_rate: values.wage_rate,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-navy-200 bg-white p-4">
      <h2 className="font-semibold text-navy-900">Work details</h2>

      {update.error && <Alert>{getErrorMessage(update.error)}</Alert>}
      {update.isSuccess && <p className="text-sm text-emerald-700">Saved.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Staff code" error={errors.staff_code?.message}>
          <input className={INPUT_CLASS} {...register("staff_code")} />
        </Field>
        <Field label="Start date" error={errors.start_date?.message}>
          <input type="date" className={INPUT_CLASS} {...register("start_date")} />
        </Field>
        <Field label="Schedule">
          <select className={INPUT_CLASS} disabled={schedules.isPending} {...register("schedule_id")}>
            <option value="">No schedule</option>
            {schedules.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Wage type">
          <select className={INPUT_CLASS} {...register("wage_type")}>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="fixed">Fixed</option>
          </select>
        </Field>
        <Field label="Wage rate" error={errors.wage_rate?.message}>
          <input inputMode="decimal" className={INPUT_CLASS} {...register("wage_rate")} />
        </Field>
      </div>

      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}