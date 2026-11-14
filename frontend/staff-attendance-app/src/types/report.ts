import type { PayStatus } from "@/types/payroll";

// date_from and date_to are REQUIRED by the backend for this report
export type AttendanceReportParams = {
  date_from: string;
  date_to: string;
  employee_id?: number;
};

export type PayReportParams = {
  employee_id?: number;
  status?: PayStatus;
  date_from?: string;
  date_to?: string;
};