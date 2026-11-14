export type PayStatus = "draft" | "approved";

// PaySummaryOut
export type PaySummary = {
  id: number;
  employee_id: number;
  employee_name: string;
  period_start: string; // "2026-11-01" (a day)
  period_end: string;
  worked_minutes: number;
  overtime_minutes: number;
  late_minutes: number;
  days_present: number;
  incomplete_days: number;
  gross_estimate: string; // money = text
  adjustments: string;
  adjustment_note: string | null;
  net_estimate: string;
  status: PayStatus;
  approved_at: string | null;
  // "unknown" = we do not know its shape, so TypeScript makes us check before using it
  calculation_details: Record<string, unknown> | null;
};

export type PayListParams = {
  employee_id?: number;
  status?: PayStatus;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};

export type PayGenerateInput = {
  period_start: string;
  period_end: string;
  employee_id?: number | null; // null or missing = everyone
};

// Partial success: some summaries were made, some employees were skipped (with a reason)
export type PayGenerateResult = {
  summaries: PaySummary[];
  skipped: string[];
};

export type PayAdjustmentInput = {
  adjustments: string;
  adjustment_note?: string | null;
};