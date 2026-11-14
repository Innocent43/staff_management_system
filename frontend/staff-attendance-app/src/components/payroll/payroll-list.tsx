"use client";

import { useState } from "react";
import Link from "next/link";

import { PayStatusBadge } from "@/components/payroll/pay-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Pager } from "@/components/ui/pager";
import { Skeleton } from "@/components/ui/skeleton";
import { TableShell } from "@/components/ui/table";
import { useBusinessCurrency } from "@/hooks/use-business-currency";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { usePaySummaries } from "@/hooks/use-payroll";
import { formatDuration, formatMoney, formatPeriod } from "@/lib/format";
import { pageParams, splitPage } from "@/lib/pagination";
import type { PayListParams, PayStatus } from "@/types/payroll";

import { PayExportButton } from "./pay-export-button";

type Filters = {
  status: PayStatus | "";
  employeeId: string; // "" means everyone
  from: string; // "" means no limit
  to: string;
};

export function PayrollList() {
  const { people } = useEmployeeOptions();

  const [filters, setFilters] = useState<Filters>({
    status: "",
    employeeId: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(0);

  function updateFilters(changes: Partial<Filters>) {
    setFilters((previous) => ({ ...previous, ...changes }));
    setPage(0);
  }

  const params: PayListParams = {
    status: filters.status || undefined,
    employee_id: filters.employeeId ? Number(filters.employeeId) : undefined,
    date_from: filters.from || undefined,
    date_to: filters.to || undefined,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Field label="Status">
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as PayStatus | "" })}
              className={INPUT_CLASS}
            >
              <option value="">Any status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
            </select>
          </Field>
        </div>

        <div className="w-52">
          <Field label="Employee">
            <select
              value={filters.employeeId}
              onChange={(e) => updateFilters({ employeeId: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="">Everyone</option>
              {people
                .filter((person) => person.status !== "invited") // invited people have no pay
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.user.full_name}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        <div className="w-40">
          <Field label="From">
            <input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => updateFilters({ from: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div className="w-40">
          <Field label="To">
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => updateFilters({ to: e.target.value })}
              className={INPUT_CLASS}
            />
          </Field>
          
        </div>
                <div className="ml-auto">
          <PayExportButton params={params} />
        </div>
      </div>

      <PayrollTable params={params} page={page} onPageChange={setPage} />
    </div>
  );
}

type TableProps = {
  params: PayListParams;
  page: number;
  onPageChange: (page: number) => void;
};

function PayrollTable({ params, page, onPageChange }: TableProps) {
  const currency = useBusinessCurrency();
  const { data, error, isPending, isPlaceholderData, refetch } = usePaySummaries({
    ...params,
    ...pageParams(page),
  });

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;

  const { rows, hasNext } = splitPage(data);

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <EmptyState
          title="No pay summaries"
          text="Use Generate payroll to create summaries for a pay period."
        />
      ) : (
        <TableShell
          columns={["Employee", "Period", "Worked", "Late", "Gross", "Net", "Status"]}
          dimmed={isPlaceholderData}
        >
          {rows.map((summary) => (
            <tr key={summary.id} className="border-t border-navy-100">
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/payroll/${summary.id}`}
                  className="font-medium text-navy-900 hover:underline"
                >
                  {summary.employee_name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {formatPeriod(summary.period_start, summary.period_end)}
              </td>
              <td className="px-4 py-3">{formatDuration(summary.worked_minutes)}</td>
              <td className="px-4 py-3">
                {summary.late_minutes > 0 ? formatDuration(summary.late_minutes) : "-"}
              </td>
              <td className="px-4 py-3">{formatMoney(summary.gross_estimate, currency)}</td>
              <td className="px-4 py-3 font-medium text-navy-900">
                {formatMoney(summary.net_estimate, currency)}
              </td>
              <td className="px-4 py-3">
                <PayStatusBadge status={summary.status} />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Pager page={page} hasNext={hasNext} onChange={onPageChange} />
    </div>
  );
}