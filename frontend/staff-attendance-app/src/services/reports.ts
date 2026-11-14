import { downloadFile } from "@/lib/download";
import { buildQuery } from "@/lib/query-string";
import type { AttendanceReportParams, PayReportParams } from "@/types/report";

export function downloadAttendanceReport(params: AttendanceReportParams) {
  const filename = `attendance_${params.date_from}_to_${params.date_to}.csv`;
  return downloadFile(`/reports/attendance.csv${buildQuery(params)}`, filename);
}

export function downloadPayReport(params: PayReportParams) {
  const range =
    params.date_from && params.date_to ? `_${params.date_from}_to_${params.date_to}` : "";
  return downloadFile(`/reports/pay-summaries.csv${buildQuery(params)}`, `pay-summaries${range}.csv`);
}