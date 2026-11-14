import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listAuditLogs } from "@/services/audit-logs";
import type { AuditLogParams } from "@/types/audit";

export function useAuditLogs(params: AuditLogParams) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => listAuditLogs(params),
    placeholderData: keepPreviousData,
  });
}