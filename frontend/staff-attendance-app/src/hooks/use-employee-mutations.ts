import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deactivateEmployee,
  inviteEmployee,
  reactivateEmployee,
  updateEmployee,
} from "@/services/employees";
import type { EmployeeUpdateInput } from "@/types/employee";

// The cache manager. We use it to say "this data is out of date"
function useRefreshEmployees() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["employees"] });
}

export function useInviteEmployee() {
  const refresh = useRefreshEmployees();
  return useMutation({
    mutationFn: inviteEmployee,
    onSuccess: refresh,
  });
}

export function useUpdateEmployee(id: number) {
  const refresh = useRefreshEmployees();
  return useMutation({
    mutationFn: (input: EmployeeUpdateInput) => updateEmployee(id, input),
    onSuccess: refresh,
  });
}

export function useDeactivateEmployee() {
  const refresh = useRefreshEmployees();
  return useMutation({
    mutationFn: deactivateEmployee, 
    onSuccess: refresh,
  });
}

export function useReactivateEmployee() {
  const refresh = useRefreshEmployees();
  return useMutation({
    mutationFn: reactivateEmployee,
    onSuccess: refresh,
  });
}