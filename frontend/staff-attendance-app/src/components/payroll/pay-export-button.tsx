"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDownloadPayReport } from "@/hooks/use-report-downloads";
import { getErrorMessage } from "@/lib/errors";
import type { PayReportParams } from "@/types/report";

export function PayExportButton({ params }: { params: PayReportParams }) {
  const download = useDownloadPayReport();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={() => download.mutate(params)} disabled={download.isPending}>
        <Download className="size-4" />
        {download.isPending ? "Preparing..." : "Export CSV"}
      </Button>
      {download.error && (
        <p className="text-xs text-red-600">{getErrorMessage(download.error)}</p>
      )}
    </div>
  );
}