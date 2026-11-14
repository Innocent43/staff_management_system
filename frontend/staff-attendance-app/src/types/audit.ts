export type AuditLog = {
  id: number;
  actor_user_id: number | null; // null = no person (for example a system job)
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type AuditLogParams = {
  action?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};