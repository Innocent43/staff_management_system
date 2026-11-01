import { api } from "@/lib/api";
import type {
  AcceptInvitePayload,
  LoginPayload,
  MeResponse,
  RegisterPayload,
  TokenResponse,
} from "@/types/auth";

export const registerBusiness = (payload: RegisterPayload) =>
  api<TokenResponse>("/auth/register", { method: "POST", body: payload });

export const login = (payload: LoginPayload) =>
  api<TokenResponse>("/auth/login", { method: "POST", body: payload });

export const acceptInvite = (payload: AcceptInvitePayload) =>
  api<TokenResponse>("/auth/accept-invite", { method: "POST", body: payload });

export const getMe = () => api<MeResponse>("/auth/me");