"use client";

import { useState } from "react";

import { DateRangeFilter } from "@/components/attendance/date-range-filter";
import { EmptyState } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";
import { INPUT_CLASS } from "../ui/field";
import { Skeleton } from "../ui/skeleton";
import { TableShell } from "@/components/ui/table";
import { useShifts } from "@/hooks/use-attendance-events";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { useEmployeeOptions } from "@/hooks/use-employee-options";
import { daysAgo, toDateInput } from "@/lib/dates";
import { formatDate, formatDuration, formatTime } from "@/lib/format";

export function ShiftsPanel() {
  const timeZone = useBusinessTimezone();
  const { people } = useEmployeeOptions();

  // Passing a FUNCTION to useState runs it once, on the first render only
  const [range, setRange] = useState(() => ({
    from: toDateInput(daysAgo(6), timeZone),
    to: toDateInput(new Date(), timeZone),
  }));
  const [employeeId, setEmployeeId] = useState(""); // "" means everyone

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <DateRangeFilter
          from={range.from}
          to={range.to}
          onChange={(from, to) => setRange({ from, to })}
        />
        <div className="sm:w-56">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
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
      </div>

      <ShiftsTable
        dateFrom={range.from}
        dateTo={range.to}
        employeeId={employeeId ? Number(employeeId) : undefined}
      />
    </div>
  );
}

type TableProps = { dateFrom: string; dateTo: string; employeeId?: number };

function ShiftsTable({ dateFrom, dateTo, employeeId }: TableProps) {
  const timeZone = useBusinessTimezone();
  const { data, error, isPending, isPlaceholderData, refetch } = useShifts({
    date_from: dateFrom,
    date_to: dateTo,
    employee_id: employeeId,
  });

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-48 w-full" />;
  if (data.length === 0) {
    return <EmptyState title="No shifts found" text="Try a wider date range." />;
  }

  return (
    <TableShell
      columns={["Employee", "Date", "In", "Out", "Worked", "Late", "Flags"]}
      dimmed={isPlaceholderData}
    >
      {data.map((shift) => (
        <tr
          key={`${shift.employee_id}-${shift.clock_in ?? shift.clock_out}`}
          className="border-t border-navy-100"
        >
          <td className="px-4 py-3 font-medium text-navy-900">{shift.employee_name}</td>
          <td className="px-4 py-3">
            {formatDate(shift.clock_in ?? shift.clock_out, timeZone)}
          </td>
          <td className="px-4 py-3">{formatTime(shift.clock_in, timeZone)}</td>
          <td className="px-4 py-3">{formatTime(shift.clock_out, timeZone)}</td>
          <td className="px-4 py-3">{formatDuration(shift.duration_minutes)}</td>
          <td className="px-4 py-3">
            {shift.late_minutes > 0 ? formatDuration(shift.late_minutes) : "-"}
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {shift.flags.map((flag) => (
                <span
                  key={flag}
                  className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
                >
                  {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </td>
        </tr>
      ))}
    </TableShell>
  );
}