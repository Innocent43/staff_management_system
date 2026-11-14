import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getSummary, listSummaries } from "@/services/payroll";
import type { PayListParams } from "@/types/payroll";

export function usePaySummaries(params: PayListParams) {
  return useQuery({
    queryKey: ["payroll", "list", params],
    queryFn: () => listSummaries(params),
    placeholderData: keepPreviousData,
  });
}

export function usePaySummary(id: number) {
  return useQuery({
    queryKey: ["payroll", "detail", id],
    queryFn: () => getSummary(id),
  });
}