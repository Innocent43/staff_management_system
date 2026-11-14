"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRegenerateWorkplace,
  useUpdateWorkplace,
} from "@/hooks/use-workplace-mutations";
import { useWorkplaces } from "@/hooks/use-workplaces";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/errors";
import type { Workplace } from "@/types/workplaces";

const SMALL_BUTTON =
  "inline-flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-navy-700 hover:bg-navy-50 disabled:opacity-50";

export function WorkplaceList({ onEdit }: { onEdit: (workplace: Workplace) => void }) {
  const { data, error, isPending, refetch } = useWorkplaces();

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-32 w-full" />;
  if (data.length === 0) {
    return (
      <EmptyState
        title="No workplaces yet"
        text="Create a workplace to get a QR code your employees can scan to clock in."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((workplace) => (
        <WorkplaceRow key={workplace.id} workplace={workplace} onEdit={onEdit} />
      ))}
    </ul>
  );
}

type RowProps = { workplace: Workplace; onEdit: (workplace: Workplace) => void };

function WorkplaceRow({ workplace, onEdit }: RowProps) {
  const update = useUpdateWorkplace(workplace.id);
  const regenerate = useRegenerateWorkplace();
  const error = update.error ?? regenerate.error; // whichever one failed

  function handleToggle() {
    if (
      workplace.active &&
      !window.confirm("Deactivate this workplace? Employees will not be able to clock in here.")
    ) {
      return;
    }
    update.mutate({ active: !workplace.active });
  }

  function handleRegenerate() {
    const message =
      "Regenerate the secret? QR codes already shown or printed will stop working immediately.";
    if (window.confirm(message)) regenerate.mutate(workplace.id);
  }

  return (
    <li className="space-y-3 rounded-xl border border-navy-200 bg-white p-4">
      {error && <Alert>{getErrorMessage(error)}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-medium text-navy-900">{workplace.name}</p>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              workplace.active
                ? "bg-emerald-100 text-emerald-800"
                : "bg-navy-100 text-navy-600",
            )}
          >
            {workplace.active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {workplace.active && (
            <Link href={`/dashboard/workplaces/${workplace.id}/qr`} className={SMALL_BUTTON}>
              <QrCode className="size-4" /> Show QR
            </Link>
          )}
          <button className={SMALL_BUTTON} onClick={() => onEdit(workplace)}>
            Rename
          </button>
          <button className={SMALL_BUTTON} disabled={update.isPending} onClick={handleToggle}>
            {workplace.active ? "Deactivate" : "Activate"}
          </button>
          <button
            className={SMALL_BUTTON}
            disabled={regenerate.isPending}
            onClick={handleRegenerate}
          >
            Regenerate secret
          </button>
        </div>
      </div>
    </li>
  );
}