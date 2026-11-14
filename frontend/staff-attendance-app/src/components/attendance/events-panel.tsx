"use client";

import { useState, type ReactNode } from "react";


import { CorrectEventDialog } from "./correct-event-dialog";
import { CorrectionsDialog } from "./corrections-dialog";

import { DateRangeFilter } from "@/components/attendance/date-range-filter";
import { EventTypeBadge } from "@/components/attendance/event-type-badge";
import { VoidEventDialog } from "./void-event-dialog";
import { EmptyState } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";
import { INPUT_CLASS } from "@/components/ui/field";
import { Pager } from "@/components/ui/pager";
import { Skeleton } from "../ui/skeleton";
import { TableShell } from "@/components/ui/table";
import { useEvents } from "@/hooks/use-attendance-events";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { cn } from "@/lib/cn";
import { daysAgo, toDateInput } from "@/lib/dates";
import { formatDateTime } from "@/lib/format";
import { pageParams, splitPage } from "@/lib/pagination";
import type { AttendanceEvent } from "@/types/attendance";

type Filters = {
  from: string;
  to: string;
  employeeId: string; // "" means everyone
  includeVoided: boolean;
};

// Which dialog is open, and for which event. null = none.
type Action = { kind: "correct" | "void" | "history"; event: AttendanceEvent };

export function EventsPanel() {
  const timeZone = useBusinessTimezone();
  const { people } = useEmployeeOptions();

  const [filters, setFilters] = useState<Filters>(() => ({
    from: toDateInput(daysAgo(6), timeZone),
    to: toDateInput(new Date(), timeZone),
    employeeId: "",
    includeVoided: false,
  }));
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<Action | null>(null);

  // Partial<Filters> = an object that may contain SOME of the filter fields
  function updateFilters(changes: Partial<Filters>) {
    setFilters((previous) => ({ ...previous, ...changes }));
    setPage(0); // any filter change starts again from page 1
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <DateRangeFilter
          from={filters.from}
          to={filters.to}
          onChange={(from, to) => updateFilters({ from, to })}
        />
        <div className="lg:w-56">
          <select
            value={filters.employeeId}
            onChange={(e) => updateFilters({ employeeId: e.target.value })}
            className={INPUT_CLASS}
          >
            <option value="">All employees</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.user.full_name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            checked={filters.includeVoided}
            onChange={(e) => updateFilters({ includeVoided: e.target.checked })}
          />
          Show voided
        </label>
      </div>

      <EventsTable
        filters={filters}
        page={page}
        onPageChange={setPage}
        onAction={setAction}
      />

      {action?.kind === "correct" && (
        <CorrectEventDialog event={action.event} onClose={() => setAction(null)} />
      )}
      {action?.kind === "void" && (
        <VoidEventDialog event={action.event} onClose={() => setAction(null)} />
      )}
      {action?.kind === "history" && (
        <CorrectionsDialog event={action.event} onClose={() => setAction(null)} />
      )}
    </div>
  );
}

type TableProps = {
  filters: Filters;
  page: number;
  onPageChange: (page: number) => void;
  onAction: (action: Action) => void;
};

function EventsTable({ filters, page, onPageChange, onAction }: TableProps) {
  const timeZone = useBusinessTimezone();
  const { nameOf } = useEmployeeOptions();

  const { data, error, isPending, isPlaceholderData, refetch } = useEvents({
    date_from: filters.from,
    date_to: filters.to,
    employee_id: filters.employeeId ? Number(filters.employeeId) : undefined,
    include_voided: filters.includeVoided,
    ...pageParams(page),
  });

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-64 w-full" />;

  const { rows, hasNext } = splitPage(data);

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <EmptyState title="No events found" text="Try a wider date range." />
      ) : (
        <TableShell
          columns={["Employee", "Type", "Time", "Source", "Note", ""]}
          dimmed={isPlaceholderData}
        >
          {rows.map((event) => (
            <tr key={event.id} className="border-t border-navy-100">
              <td className="px-4 py-3 font-medium text-navy-900">
                {nameOf(event.employee_id)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <EventTypeBadge type={event.event_type} />
                  {event.is_voided && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      Voided
                    </span>
                  )}
                </div>
              </td>
              <td className={cn("px-4 py-3", event.is_voided && "line-through opacity-60")}>
                {formatDateTime(event.occurred_at, timeZone)}
              </td>
              <td className="px-4 py-3">{event.source === "qr" ? "QR" : "Manual"}</td>
              <td className="px-4 py-3 text-navy-600">{event.note ?? "-"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {!event.is_voided && (
                  <>
                    <ActionButton onClick={() => onAction({ kind: "correct", event })}>
                      Correct
                    </ActionButton>
                    <ActionButton danger onClick={() => onAction({ kind: "void", event })}>
                      Void
                    </ActionButton>
                  </>
                )}
                <ActionButton onClick={() => onAction({ kind: "history", event })}>
                  History
                </ActionButton>
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Pager page={page} hasNext={hasNext} onChange={onPageChange} />
    </div>
  );
}

type ActionButtonProps = { onClick: () => void; danger?: boolean; children: ReactNode };

function ActionButton({ onClick, danger, children }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 text-xs font-medium hover:underline",
        danger ? "text-red-600" : "text-navy-700",
      )}
    >
      {children}
    </button>
  );
}