import { api } from "@/lib/api";
import { buildQuery } from "@/lib/query-string";
import type {
  PayAdjustmentInput,
  PayGenerateInput,
  PayGenerateResult,
  PayListParams,
  PaySummary,
} from "@/types/payroll";

export function generateSummaries(input: PayGenerateInput) {
  return api<PayGenerateResult>("/pay-summaries/generate", { method: "POST", body: input });
}

export function listSummaries(params: PayListParams = {}) {
  return api<PaySummary[]>(`/pay-summaries${buildQuery(params)}`);
}

export function getSummary(id: number) {
  return api<PaySummary>(`/pay-summaries/${id}`);
}

export function adjustSummary(id: number, input: PayAdjustmentInput) {
  return api<PaySummary>(`/pay-summaries/${id}/adjust`, { method: "PATCH", body: input });
}

export function approveSummary(id: number) {
  return api<PaySummary>(`/pay-summaries/${id}/approve`, { method: "POST" });
}