import { api } from "@/lib/api";
import { buildQuery } from "@/lib/query-string";
import type {
  Employee,
  EmployeeListParams,
  EmployeeUpdateInput,
  InviteInput,
  InviteResult,
} from "@/types/employee";

export function listEmployees(params: EmployeeListParams = {}) {
  return api<Employee[]>(`/employees${buildQuery(params)}`);
}

export function getEmployee(id: number) {
  return api<Employee>(`/employees/${id}`);
}

export function inviteEmployee(input: InviteInput) {
  return api<InviteResult>("/employees/invite", { method: "POST", body: input });
}

export function updateEmployee(id: number, input: EmployeeUpdateInput) {
  return api<Employee>(`/employees/${id}`, { method: "PATCH", body: input });
}

export function deactivateEmployee(id: number) {
  return api<Employee>(`/employees/${id}/deactivate`, { method: "POST" });
}

export function reactivateEmployee(id: number) {
  return api<Employee>(`/employees/${id}/reactivate`, { method: "POST" });
}