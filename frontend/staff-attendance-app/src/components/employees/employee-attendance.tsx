
"use client";

import { useState } from "react";

import { DateRangeFilter } from "@/components/attendance/date-range-filter";
import { EventTypeBadge } from "@/components/attendance/event-type-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pager } from "@/components/ui/pager";
import { Skeleton } from "@/components/ui/skeleton";
import { TableShell } from "@/components/ui/table";
import { useEvents } from "@/hooks/use-attendance-events";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { cn } from "@/lib/cn";
import { daysAgo, toDateInput } from "@/lib/dates";
import { formatDateTime } from "@/lib/format";
import { pageParams, splitPage } from "@/lib/pagination";

export function EmployeeAttendance({ employeeId }: { employeeId: number }) {
  const timeZone = useBusinessTimezone();

  const [range, setRange] = useState(() => ({
    from: toDateInput(daysAgo(13), timeZone),
    to: toDateInput(new Date(), timeZone),
  }));

  const [page, setPage] = useState(0);

  return (
    <section className="space-y-4 rounded-xl border border-navy-200 bg-white p-4">
      <div>
        <h2 className="font-semibold text-navy-900">Attendance history</h2>
        <p className="text-sm text-navy-500">
          Clock-in and clock-out records for this employee.
        </p>
      </div>

      <DateRangeFilter
        from={range.from}
        to={range.to}
        onChange={(from, to) => {
          setRange({ from, to });
          setPage(0);
        }}
      />

      <EmployeeEventsTable
        employeeId={employeeId}
        range={range}
        page={page}
        onPageChange={setPage}
      />
    </section>
  );
}

type TableProps = {
  employeeId: number;
  range: { from: string; to: string };
  page: number;
  onPageChange: (page: number) => void;
};

function EmployeeEventsTable({
  employeeId,
  range,
  page,
  onPageChange,
}: TableProps) {
  const timeZone = useBusinessTimezone();

  const { data, error, isPending, isPlaceholderData, refetch } = useEvents({
    employee_id: employeeId,
    date_from: range.from,
    date_to: range.to,
    ...pageParams(page),
  });

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  if (isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  const { rows, hasNext } = splitPage(data);

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <EmptyState
          title="No attendance records"
          text="Nothing recorded for this employee in this period."
        />
      ) : (
        <TableShell
          columns={["Time", "Type", "Source", "Note"]}
          dimmed={isPlaceholderData}
        >
          {rows.map((event) => (
            <tr key={event.id} className="border-t border-navy-100">
              <td
                className={cn(
                  "px-4 py-3",
                  event.is_voided && "line-through opacity-60"
                )}
              >
                {formatDateTime(event.occurred_at, timeZone)}
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

              <td className="px-4 py-3">
                {event.source === "qr" ? "QR" : "Manual"}
              </td>

              <td className="px-4 py-3 text-navy-600">
                {event.note ?? "-"}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <Pager page={page} hasNext={hasNext} onChange={onPageChange} />
    </div>
  );
}
