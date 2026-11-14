"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { AuditDetails } from "./audit-details";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Pager } from "@/components/ui/pager";
import { Skeleton } from "@/components/ui/skeleton";
import { TableShell } from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { formatDateTime } from "@/lib/format";
import { pageParams, splitPage } from "@/lib/pagination";
import type { AuditLogParams } from "@/types/audit";

type Filters = { actionText: string; from: string; to: string };

export function AuditLogList() {
  const [filters, setFilters] = useState<Filters>({ actionText: "", from: "", to: "" });
  const [page, setPage] = useState(0);

  // the API only sees the action text after the user pauses typing
  const action = useDebouncedValue(filters.actionText.trim());

  function updateFilters(changes: Partial<Filters>) {
    setFilters((previous) => ({ ...previous, ...changes }));
    setPage(0);
  }

  const params: AuditLogParams = {
    action: action || undefined,
    date_from: filters.from || undefined,
    date_to: filters.to || undefined,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-56 flex-1">
          <Field label="Action">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
              <input
                value={filters.actionText}
                onChange={(e) => updateFilters({ actionText: e.target.value })}
                placeholder="Search by action"
                maxLength={60}
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
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
      </div>

      <AuditTable params={params} page={page} onPageChange={setPage} />
    </div>
  );
}

type TableProps = {
  params: AuditLogParams;
  page: number;
  onPageChange: (page: number) => void;
};

function AuditTable({ params, page, onPageChange }: TableProps) {
  const timeZone = useBusinessTimezone();
  const { nameOfUser } = useEmployeeOptions();

  const { data, error, isPending, isPlaceholderData, refetch } = useAuditLogs({
    ...params,
    ...pageParams(page),
  });

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;

  const { rows, hasNext } = splitPage(data);

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <EmptyState title="No activity found" text="Try a wider date range or a different action." />
      ) : (
        <TableShell
          columns={["When", "Who", "Action", "Target", "Details"]}
          dimmed={isPlaceholderData}
        >
          {rows.map((log) => (
            <tr key={log.id} className="border-t border-navy-100 align-top">
              <td className="whitespace-nowrap px-4 py-3">
                {formatDateTime(log.created_at, timeZone)}
              </td>
              <td className="px-4 py-3 font-medium text-navy-900">
                {nameOfUser(log.actor_user_id)}
              </td>
              <td className="px-4 py-3">
               <span className="whitespace-nowrap rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium capitalize text-navy-800">
  {log.action.replace(/[._]/g, " ")}
</span>
              </td>
              <td className="px-4 py-3 capitalize">
                {log.entity_type.replace(/_/g, " ")}
                {log.entity_id !== null && ` #${log.entity_id}`}
              </td>
              <td className="px-4 py-3">
                <LogDetails details={log.details} />
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Pager page={page} hasNext={hasNext} onChange={onPageChange} />
    </div>
  );
}

function LogDetails({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-navy-400">-</span>;
  }

  return (
    <details>
      <summary className="cursor-pointer text-navy-600 hover:underline">View</summary>
      {/* JSON.stringify(value, null, 2) prints the object with 2-space indentation */}
          <div className="mt-2">
        <AuditDetails details={details} />
      </div>
    </details>
  );
}