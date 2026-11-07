import type { Role } from "@/types/auth";

export type MembershipStatus = "invited" | "active" | "deactivated";
export type WageType = "hourly" | "daily" | "fixed";

export type EmployeeUser = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
};

// What the backend sends back (EmployeeOut)
export type Employee = {
  id: number;
  staff_code: string | null;
  wage_type: WageType;
  wage_rate: string;
  start_date: string | null; // "2026-11-06" (date only)
  schedule_id: number | null;
  role: Role;
  status: MembershipStatus;
  user: EmployeeUser;
};

export type EmployeeListParams = {
  search?: string;
  status?: MembershipStatus;
  limit?: number;
  offset?: number;
};

export type InviteInput = {
  full_name: string;
  email: string;
  phone?: string | null;
  role?: Role;
};

// What the backend replies to an invite (inviteResponse)
export type InviteResult = {
  membership_id: number;
  email: string;
  role: Role;
  status: MembershipStatus;
  invite_expires_at: string;
};

export type EmployeeUpdateInput = {
  staff_code?: string | null;
  start_date?: string | null;
  schedule_id?: number | null;
  wage_type?: WageType;
  wage_rate?: number | string;
  role?: Role;
};