"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PresenceBadge } from "@/components/attendance/presence-badge";
import { useToday } from "@/hooks/use-attendance";
import { getErrorMessage } from "@/lib/errors";
import { formatDuration, formatTime } from "@/lib/format";
import type { TodayRow } from "@/types/attendance";

function describe(row: TodayRow, timezone: string): string {
  if (row.status === "clocked_in") return `Since ${formatTime(row.since, timezone)}`;
  if (row.status === "clocked_out") return `Started ${formatTime(row.since, timezone)}`;
  return "Not clocked in yet";
}

function BoardSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

function BoardList({ rows, timezone }: { rows: TodayRow[]; timezone: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No employees yet"
        text="Invite your first employee to start recording attendance."
      />
    );
  }

  return (
    <ul className="divide-y divide-navy-100">
      {rows.map((row) => (
        <li key={row.employee_id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-900">{row.employee_name}</p>
            <p className="text-sm text-navy-600">{describe(row, timezone)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {row.late_minutes > 0 && (
              <Badge variant="attention">Late {formatDuration(row.late_minutes)}</Badge>
            )}
            <PresenceBadge status={row.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TodayBoard({ timezone }: { timezone: string }) {
  const { data: rows, isPending, isError, error, refetch } = useToday();

  if (isError) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-navy-900">Who is in today</h2>
      <div className="mt-4">
        {isPending || !rows ? <BoardSkeleton /> : <BoardList rows={rows} timezone={timezone} />}
      </div>
    </Card>
  );
}