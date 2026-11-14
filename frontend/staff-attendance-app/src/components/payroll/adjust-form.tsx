"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { useBusinessCurrency } from "@/hooks/use-business-currency";
import { useAdjustSummary } from "@/hooks/use-payroll-mutations";
import { getErrorMessage } from "@/lib/errors";
import { isNumber } from "@/lib/numbers";
import type { PaySummary } from "@/types/payroll";

const schema = z.object({
  adjustments: z.string().refine(isNumber, "Enter a number, for example 2500 or -1000"),
  adjustment_note: z.string().trim().max(500, "Max 500 characters"),
});

type FormValues = z.infer<typeof schema>;

export function AdjustForm({ summary }: { summary: PaySummary }) {
  const currency = useBusinessCurrency();
  const adjust = useAdjustSummary(summary.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      adjustments: summary.adjustments,
      adjustment_note: summary.adjustment_note ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    adjust.mutate({
      adjustments: values.adjustments.trim(), // stays text, the backend reads it as a Decimal
      adjustment_note: values.adjustment_note || null,
    });
  }

  return (
    <Card>
      <h2 className="font-semibold text-navy-900">Adjust pay</h2>
      <p className="mt-1 text-sm text-navy-600">
        Use a positive number to add (a bonus) and a negative number to subtract (an advance).
        This replaces the current adjustment; it does not add to it.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {adjust.error && <Alert>{getErrorMessage(adjust.error)}</Alert>}

        <Field label={`Adjustment (${currency})`} error={errors.adjustments?.message}>
          <input inputMode="decimal" className={INPUT_CLASS} {...register("adjustments")} />
        </Field>

        <Field label="Note (optional)" error={errors.adjustment_note?.message}>
          <textarea rows={2} className={INPUT_CLASS} {...register("adjustment_note")} />
        </Field>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={adjust.isPending}>
            {adjust.isPending ? "Saving..." : "Save adjustment"}
          </Button>
          {adjust.isSuccess && <span className="text-sm text-emerald-700">Saved.</span>}
        </div>
      </form>
    </Card>
  );
}