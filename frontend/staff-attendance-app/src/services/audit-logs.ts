import { api } from "@/lib/api";
import { buildQuery } from "@/lib/query-string";
import type { AuditLog, AuditLogParams } from "@/types/audit";

export function listAuditLogs(params: AuditLogParams = {}) {
  return api<AuditLog[]>(`/audit-logs${buildQuery(params)}`);
}