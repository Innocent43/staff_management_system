import { PayReportForm } from "@/components/reports/pay-report-form";
import { AttendanceReportForm } from "@/components/reports/attendance-report-form";
export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Reports</h1>
        <p className="text-sm text-navy-600">
          Download your data as CSV files that open in Excel or Google Sheets.
        </p>
      </div>

      <AttendanceReportForm />
      <PayReportForm />
    </div>
  );
}