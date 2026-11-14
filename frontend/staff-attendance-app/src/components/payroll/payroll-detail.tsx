"use client";

import { AdjustForm } from "./adjust-form";
import { CalculationDetails } from "./calculation-details";
import { PayStatusBadge } from "@/components/payroll/pay-status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessCurrency } from "@/hooks/use-business-currency";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useApproveSummary } from "@/hooks/use-payroll-mutations";
import { usePaySummary } from "@/hooks/use-payroll";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatDuration, formatMoney, formatPeriod } from "@/lib/format";
import type { PaySummary } from "@/types/payroll";

export function PayrollDetail({ id }: { id: number }) {
  const { data, error, isPending, refetch } = usePaySummary(id);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <Header summary={data} />
      <Totals summary={data} />
      <MoneyCard summary={data} />
      {data.status === "draft" && <AdjustForm summary={data} />}
      <CalculationDetails details={data.calculation_details} />
    </div>
  );
}

function Header({ summary }: { summary: PaySummary }) {
  const timeZone = useBusinessTimezone();
  const approve = useApproveSummary();

  function handleApprove() {
    const message =
      "Approve this pay summary? There is no way to undo an approval from the app.";
    if (window.confirm(message)) approve.mutate(summary.id);
  }

  return (
    <div className="space-y-3">
      {approve.error && <Alert>{getErrorMessage(approve.error)}</Alert>}

      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-navy-200 bg-white p-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-navy-900">{summary.employee_name}</h1>
          <p className="text-sm text-navy-600">
            {formatPeriod(summary.period_start, summary.period_end)}
          </p>
          {summary.approved_at && (
            <p className="text-xs text-navy-500">
              Approved {formatDateTime(summary.approved_at, timeZone)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <PayStatusBadge status={summary.status} />
          {summary.status === "draft" && (
            <Button onClick={handleApprove} disabled={approve.isPending}>
              {approve.isPending ? "Approving..." : "Approve"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-200 bg-white p-4">
      <p className="text-xs text-navy-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function Totals({ summary }: { summary: PaySummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat label="Days present" value={String(summary.days_present)} />
      <Stat label="Incomplete days" value={String(summary.incomplete_days)} />
      <Stat label="Worked" value={formatDuration(summary.worked_minutes)} />
      <Stat label="Overtime" value={formatDuration(summary.overtime_minutes)} />
      <Stat label="Late" value={formatDuration(summary.late_minutes)} />
    </div>
  );
}

function MoneyCard({ summary }: { summary: PaySummary }) {
  const currency = useBusinessCurrency();

  return (
    <div className="space-y-3 rounded-xl border border-navy-200 bg-white p-4">
      <div className="flex justify-between text-sm text-navy-700">
        <span>Gross estimate</span>
        <span>{formatMoney(summary.gross_estimate, currency)}</span>
      </div>
      <div className="flex justify-between text-sm text-navy-700">
        <span>Adjustments</span>
        <span>{formatMoney(summary.adjustments, currency)}</span>
      </div>
      {summary.adjustment_note && (
        <p className="text-xs text-navy-500">Note: {summary.adjustment_note}</p>
      )}
      <div className="flex justify-between border-t border-navy-100 pt-3 font-semibold text-navy-900">
        <span>Net estimate</span>
        <span>{formatMoney(summary.net_estimate, currency)}</span>
      </div>
    </div>
  );
}