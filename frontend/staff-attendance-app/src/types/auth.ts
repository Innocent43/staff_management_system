export type Role = "owner" | "manager" | "employee";
export type MembershipStatus = "invited" | "active" | "deactivated";

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type User = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
};

export type Business = {
  id: number;
  name: string;
  timezone: string;
  currency: string;
};

export type MeResponse = {
  user: User;
  business: Business;
  role: Role;
};

export type RegisterPayload = {
  business_name: string;
  timezone: string;
  currency: string;
  full_name: string;
  email: string;
  phone?: string | null;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  business_id?: number;
};

export type AcceptInvitePayload = {
  token: string;
  password?: string;
};

export type InvitePayload = {
  full_name: string;
  email: string;
  phone?: string | null;
  role: "manager" | "employee";
};

export type InviteResponse = {
  membership_id: number;
  email: string;
  role: Role;
  status: MembershipStatus;
  invite_expires_at: string;
};