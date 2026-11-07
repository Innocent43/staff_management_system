import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getEmployee, listEmployees } from "@/services/employees";
import type { EmployeeListParams } from "@/types/employee";

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: ["employees", "list", params],
    queryFn: () => listEmployees(params),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: ["employees", "detail", id],
    queryFn: () => getEmployee(id),
  });
}