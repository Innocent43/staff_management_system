import { api } from "@/lib/api";
import { buildQuery } from "@/lib/query-string";
import type {
  AttendanceEvent,
  AttendanceListParams,
  ClockInput,
  Correction,
  ManualEventInput,
  MyEventsParams,
  Shift,
  ShiftParams,
  TimeCorrectionInput,
  VoidInput,
} from "@/types/attendance";


import type { MyStatus, TodayRow } from "@/types/attendance";

export const getMyStatus = ()=> api<MyStatus>("/attendance/me/status")

export const getToday = ()=> api<TodayRow[]>("/attendance/today")




export function listEvents(params: AttendanceListParams = {}) {
  return api<AttendanceEvent[]>(`/attendance${buildQuery(params)}`);
}

export function listMyEvents(params: MyEventsParams = {}) {
  return api<AttendanceEvent[]>(`/attendance/me${buildQuery(params)}`);
}

export function listShifts(params: ShiftParams) {
  return api<Shift[]>(`/attendance/shifts${buildQuery(params)}`);
}

export function listCorrections(eventId: number) {
  return api<Correction[]>(`/attendance/${eventId}/corrections`);
}

export function clockAttendance(input: ClockInput) {
  return api<AttendanceEvent>("/attendance/clock", { method: "POST", body: input });
}

export function addManualEvent(input: ManualEventInput) {
  return api<AttendanceEvent>("/attendance/manual", { method: "POST", body: input });
}

export function correctEventTime(eventId: number, input: TimeCorrectionInput) {
  return api<AttendanceEvent>(`/attendance/${eventId}`, { method: "PATCH", body: input });
}

export function voidEvent(eventId: number, input: VoidInput) {
  return api<AttendanceEvent>(`/attendance/${eventId}/void`, { method: "POST", body: input });
}