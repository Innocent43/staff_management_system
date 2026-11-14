"use client";

import { QRCodeSVG } from "qrcode.react";

import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkplaceQr, useWorkplaces } from "@/hooks/use-workplaces";

export function WorkplaceQr({ id }: { id: number }) {
  const workplaces = useWorkplaces();
  const qr = useWorkplaceQr(id);

  // There is no "get one workplace" endpoint, so we find it in the cached list
  const name = workplaces.data?.find((workplace) => workplace.id === id)?.name ?? "Workplace";

  if (qr.error) return <ErrorState message={qr.error.message} onRetry={() => qr.refetch()} />;
  if (qr.isPending) return <Skeleton className="aspect-square w-full" />;

  return (
    <div className="space-y-4 rounded-xl border border-navy-200 bg-white p-6 text-center">
      <h1 className="text-xl font-semibold text-navy-900">{name}</h1>
      <p className="text-sm text-navy-600">Employees scan this code to clock in or out.</p>

      {/* the white padding is the "quiet zone" scanners need around a QR code */}
      <div className="mx-auto w-fit rounded-lg bg-white p-4">
        <QRCodeSVG value={qr.data.token} size={288} level="M" />
      </div>

      <p className="text-xs text-navy-500">
        This code changes automatically every {qr.data.expires_in_seconds} seconds. Keep this
        page open on the screen at your entrance.
      </p>
    </div>
  );
}