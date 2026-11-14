"use client";

import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessCurrency } from "@/hooks/use-business-currency";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useUpdateWageRule, useWageRule } from "@/hooks/use-wage-rule";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import type { WageRule } from "@/types/wage-rule";

// Decimal numbers stay as text from the input to the backend (see concepts)
function isNumber(value: string): boolean {
  return value.trim() !== "" && !Number.isNaN(Number(value));
}

const schema = z.object({
  deduct_scheduled_break: z.boolean(),
  min_minutes_for_daily_pay: z
    .number()
    .int("Whole minutes only")
    .min(1, "Min 1")
    .max(1440, "Max 1440 (one day)"),
  overtime_enabled: z.boolean(),
  overtime_after_minutes: z
    .number()
    .int("Whole minutes only")
    .min(1, "Min 1")
    .max(1440, "Max 1440 (one day)"),
  overtime_multiplier: z
    .string()
    .refine((v) => isNumber(v) && Number(v) >= 1 && Number(v) <= 5, "Enter a number from 1 to 5"),
  lateness_deduction_enabled: z.boolean(),
  lateness_deduction_per_minute: z
    .string()
    .refine((v) => isNumber(v) && Number(v) >= 0, "Enter 0 or more"),
});

type FormValues = z.infer<typeof schema>;

// Data component: three early returns, then the form (which needs the data to exist)
export function WageRuleEditor() {
  const { data, error, isPending, refetch } = useWageRule();

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-96 w-full" />;

  return <WageRuleForm rule={data} />;
}

type CheckFieldProps = {
  label: string;
  hint: string;
  registration: UseFormRegisterReturn; // the object that register("...") returns
};

function CheckField({ label, hint, registration }: CheckFieldProps) {
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" className="mt-1 size-4" {...registration} />
      <span>
        <span className="block text-sm font-medium text-navy-900">{label}</span>
        <span className="block text-sm text-navy-600">{hint}</span>
      </span>
    </label>
  );
}

function WageRuleForm({ rule }: { rule: WageRule }) {
  const timezone = useBusinessTimezone();
  const currency = useBusinessCurrency();
  const update = useUpdateWageRule();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deduct_scheduled_break: rule.deduct_scheduled_break,
      min_minutes_for_daily_pay: rule.min_minutes_for_daily_pay,
      overtime_enabled: rule.overtime_enabled,
      overtime_after_minutes: rule.overtime_after_minutes,
      overtime_multiplier: rule.overtime_multiplier,
      lateness_deduction_enabled: rule.lateness_deduction_enabled,
      lateness_deduction_per_minute: rule.lateness_deduction_per_minute,
    },
  });

  // Live values of the two switches, so we can show or hide the fields under them
  const overtimeOn = watch("overtime_enabled");
  const latenessOn = watch("lateness_deduction_enabled");

  // PUT replaces the whole rule, so we always send every field
  function onSubmit(values: FormValues) {
    update.mutate(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {update.error && <Alert>{getErrorMessage(update.error)}</Alert>}

      <Card>
        <h2 className="font-semibold text-navy-900">Worked time</h2>
        <div className="mt-4 space-y-4">
          <CheckField
            label="Deduct scheduled break"
            hint="Subtract the break minutes of the employee's schedule from their worked time."
            registration={register("deduct_scheduled_break")}
          />
          <Field
            label="Minimum minutes for daily pay"
            error={errors.min_minutes_for_daily_pay?.message}
          >
            <input
              type="number"
              className={INPUT_CLASS}
              {...register("min_minutes_for_daily_pay", { valueAsNumber: true })}
            />
          </Field>
          <p className="text-sm text-navy-600">
            For daily-wage staff, a day only counts if they worked at least this many minutes.
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-navy-900">Overtime</h2>
        <div className="mt-4 space-y-4">
          <CheckField
            label="Pay overtime"
            hint="Minutes beyond the limit below are paid at a higher rate."
            registration={register("overtime_enabled")}
          />
          {overtimeOn && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Overtime starts after (minutes)" error={errors.overtime_after_minutes?.message}>
                <input
                  type="number"
                  className={INPUT_CLASS}
                  {...register("overtime_after_minutes", { valueAsNumber: true })}
                />
              </Field>
              <Field label="Rate multiplier (1 to 5)" error={errors.overtime_multiplier?.message}>
                <input
                  inputMode="decimal"
                  className={INPUT_CLASS}
                  {...register("overtime_multiplier")}
                />
              </Field>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-navy-900">Lateness</h2>
        <div className="mt-4 space-y-4">
          <CheckField
            label="Deduct pay for lateness"
            hint="Late minutes (after the schedule's grace period) reduce the pay estimate."
            registration={register("lateness_deduction_enabled")}
          />
          {latenessOn && (
            <Field
              label={`Deduction per late minute (${currency})`}
              error={errors.lateness_deduction_per_minute?.message}
            >
              <input
                inputMode="decimal"
                className={INPUT_CLASS}
                {...register("lateness_deduction_per_minute")}
              />
            </Field>
          )}
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save rules"}
        </Button>
        {update.isSuccess && <span className="text-sm text-emerald-700">Saved.</span>}
        <span className="text-xs text-navy-500">
          Last updated {formatDateTime(rule.updated_at, timezone)}
        </span>
      </div>
    </form>
  );
}