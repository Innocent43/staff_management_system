import { AuditLogList } from "@/components/audit/audit-log-list";
export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Audit log</h1>
        <p className="text-sm text-navy-600">A record of who did what, and when.</p>
      </div>
      <AuditLogList />
    </div>
  );
}