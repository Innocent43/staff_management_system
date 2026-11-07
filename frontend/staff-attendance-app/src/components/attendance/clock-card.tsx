"use client";

import Link from "next/link";
import { ScanLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyStatus } from "@/hooks/use-attendance";
import { getErrorMessage } from "@/lib/errors";
import { formatTime } from "@/lib/format";

export function ClockCard({ timezone }: { timezone: string }) {
  const { data, isPending, isError, error, refetch } = useMyStatus();

  if (isError) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  if (isPending || !data) {
    return (
      <Card>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-48" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-navy-600">Your status</p>
        {data.clocked_in ? (
          <div className="mt-1 flex items-center gap-3">
            <Badge variant="progress">Clocked in</Badge>
            <p className="text-lg font-semibold text-navy-900">
              since {formatTime(data.since, timezone)}
            </p>
          </div>
        ) : (
          <div className="mt-1">
            <Badge variant="neutral">Not clocked in</Badge>
          </div>
        )}
      </div>

      <Link
        href="/dashboard/scan"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-700"
      >
        <ScanLine className="h-5 w-5" aria-hidden="true" />
        {data.clocked_in ? "Scan to clock out" : "Scan to clock in"}
      </Link>
    </Card>
  );
}