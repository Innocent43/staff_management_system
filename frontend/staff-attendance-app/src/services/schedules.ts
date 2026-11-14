import { api } from "@/lib/api";
import type { Schedule, ScheduleInput } from "@/types/schedule";

export function listSchedules() {
  return api<Schedule[]>("/schedules");
}

export function createSchedule(input: ScheduleInput) {
  return api<Schedule>("/schedules", { method: "POST", body: input });
}

export function updateSchedule(id: number, input: ScheduleInput) {
  return api<Schedule>(`/schedules/${id}`, { method: "PATCH", body: input });
}

export function deleteSchedule(id: number) {
  return api<void>(`/schedules/${id}`, { method: "DELETE" });
}