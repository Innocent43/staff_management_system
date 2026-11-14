import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getWageRule, updateWageRule } from "@/services/wage-rules";

export function useWageRule() {
  return useQuery({ queryKey: ["wage-rules"], queryFn: getWageRule });
}

export function useUpdateWageRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWageRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wage-rules"] }),
  });
}