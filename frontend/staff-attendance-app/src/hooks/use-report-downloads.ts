import { useMutation } from "@tanstack/react-query";

import { downloadAttendanceReport, downloadPayReport } from "@/services/reports";

// A download is an ACTION you trigger, not data you want cached and shown,
// so it is a mutation. We get isPending and error for free.
export function useDownloadAttendanceReport() {
  return useMutation({ mutationFn: downloadAttendanceReport });
}

export function useDownloadPayReport() {
  return useMutation({ mutationFn: downloadPayReport });
}