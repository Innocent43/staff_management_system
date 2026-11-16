import { api } from "@/lib/api";
import type {
  AddressSearchResponse,
} from "@/types/workplaces";

import type { QrToken,Workplace,WorkplaceCreateInput,WorkplaceUpdateInput } from "@/types/workplaces";


export function listWorkplaces() {
  return api<Workplace[]>("/workplaces");
}

export function createWorkplace(input: WorkplaceCreateInput) {
  return api<Workplace>("/workplaces", { method: "POST", body: input });
}

export function updateWorkplace(id: number, input: WorkplaceUpdateInput) {
  return api<Workplace>(`/workplaces/${id}`, { method: "PATCH", body: input });
}

export function regenerateWorkplace(id: number) {
  return api<Workplace>(`/workplaces/${id}/regenerate`, { method: "POST" });
}

export function getQrToken(id: number) {
  return api<QrToken>(`/workplaces/${id}/qr`);
}


export function searchWorkplaceAddresses(query: string) {
  return api<AddressSearchResponse>(
    `/workplaces/address-search?q=${encodeURIComponent(query)}`
  );
}