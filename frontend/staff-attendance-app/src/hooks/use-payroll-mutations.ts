import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adjustSummary, approveSummary, generateSummaries } from "@/services/payroll";
import type { PayAdjustmentInput } from "@/types/payroll";

// Every payroll query key starts with "payroll": one call refreshes lists AND details
function useRefreshPayroll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["payroll"] });
}

export function useGenerateSummaries() {
  const refresh = useRefreshPayroll();
  return useMutation({ mutationFn: generateSummaries, onSuccess: refresh });
}

export function useAdjustSummary(id: number) {
  const refresh = useRefreshPayroll();
  return useMutation({
    mutationFn: (input: PayAdjustmentInput) => adjustSummary(id, input),
    onSuccess: refresh,
  });
}

export function useApproveSummary() {
  const refresh = useRefreshPayroll();
  return useMutation({ mutationFn: approveSummary, onSuccess: refresh }); // mutate(summaryId)
}