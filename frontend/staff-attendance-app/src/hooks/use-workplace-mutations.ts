import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createWorkplace,
  regenerateWorkplace,
  updateWorkplace,
} from "@/services/workplaces";

import type { Workplace, WorkplaceCreateInput,WorkplaceUpdateInput } from "@/types/workplaces";

// Every workplace query key starts with "workplaces", so this refreshes the
// list AND any open QR code in one call.
function useRefreshWorkplaces() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["workplaces"] });
}

// Used by the form: no workplace passed = create, a workplace passed = rename
export function useSaveWorkplace(workplace?: Workplace) {
  const refresh = useRefreshWorkplaces();
  return useMutation({
    mutationFn: (input: WorkplaceCreateInput) =>
      workplace ? updateWorkplace(workplace.id, input) : createWorkplace(input),
    onSuccess: refresh,
  });
}

// Used by the row buttons (activate / deactivate)
export function useUpdateWorkplace(id: number) {
  const refresh = useRefreshWorkplaces();
  return useMutation({
    mutationFn: (input: WorkplaceUpdateInput) => updateWorkplace(id, input),
    onSuccess: refresh,
  });
}

export function useRegenerateWorkplace() {
  const refresh = useRefreshWorkplaces();
  return useMutation({
    mutationFn: regenerateWorkplace, // called as mutate(workplaceId)
    onSuccess: refresh,
  });
}