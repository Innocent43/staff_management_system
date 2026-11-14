"use client";

import { EmptyState } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "../ui/skeleton";
import { useCorrections } from "@/hooks/use-attendance-events";
import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { formatDateTime } from "@/lib/format";
import type { AttendanceEvent } from "@/types/attendance";

type Props = { event: AttendanceEvent; onClose: () => void };

export function CorrectionsDialog({ event, onClose }: Props) {
  return (
    <Modal title="Change history" onClose={onClose}>
      <CorrectionsList eventId={event.id} />
    </Modal>
  );
}

function CorrectionsList({ eventId }: { eventId: number }) {
  const timeZone = useBusinessTimezone();
  const { data, error, isPending, refetch } = useCorrections(eventId);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-24 w-full" />;
  if (data.length === 0) {
    return <EmptyState title="No changes" text="This event was never corrected." />;
  }

  return (
    <ul className="space-y-3">
      {data.map((correction) => (
        <li key={correction.id} className="rounded-lg border border-navy-100 p-3 text-sm">
          <p className="font-medium text-navy-900">
            {correction.action === "void"
              ? "Voided"
              : `Time changed: ${formatDateTime(correction.old_occurred_at, timeZone)} → ${formatDateTime(correction.new_occurred_at, timeZone)}`}
          </p>
          <p className="text-navy-600">Reason: {correction.reason}</p>
          <p className="text-xs text-navy-400">
            {formatDateTime(correction.created_at, timeZone)}
          </p>
        </li>
      ))}
    </ul>
  );
}