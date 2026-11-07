"use client";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToday } from "@/hooks/use-attendance";
import { getErrorMessage } from "@/lib/errors";

export function TodaySummary() {
  const { data: rows, isPending, isError, error, refetch } = useToday();

  if (isError) {
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  if (isPending || !rows) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Card key={index}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-12" />
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    { label: "Clocked in now", value: rows.filter((row) => row.status === "clocked_in").length },
    { label: "Not in yet", value: rows.filter((row) => row.status === "not_in").length },
    { label: "Late today", value: rows.filter((row) => row.late_minutes > 0).length },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <p className="text-sm text-navy-600">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}