export type PresenceStatus = "clocked_in" | "clocked_out" | "not_in"


export type TodayRow = {
    employee_id: number
    employee_name: string
    status: PresenceStatus
    since: string | null
    late_minutes: number
}


export type MyStatus = {
    clocked_in: boolean
    since: string | null
}



export type EventType = "clock_in" | "clock_out";
export type EventSource = "qr" | "manual";

// AttendanceOut: one clock-in or clock-out record
export type AttendanceEvent = {
  id: number;
  employee_id: number;
  event_type: EventType;
  source: EventSource;
  occurred_at: string;
  recorded_at: string;
  is_voided: boolean;
  workplace_id: number | null;
  note: string | null;

  // Employee's recorded device location
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;

  // Backend location verification
  location_verified: boolean | null;
  distance_from_workplace_m: number | null;

  // Workplace coordinates at the time of attendance
  workplace_latitude: number | null;
  workplace_longitude: number | null;
};

// ShiftOut: one clock-in paired with its clock-out, calculated by the backend
export type Shift = {
  employee_id: number;
  employee_name: string;
  clock_in: string | null;
  clock_out: string | null;
  duration_minutes: number;
  late_minutes: number;
  flags: string[];
};

// CorrectionOut: one entry in an event's audit trail
export type Correction = {
  id: number;
  event_id: number;
  corrected_by_id: number;
  action: "change_time" | "void";
  old_occurred_at: string | null;
  new_occurred_at: string | null;
  reason: string;
  created_at: string;
};

// Query-string filters
export type AttendanceListParams = {
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  employee_id?: number;
  include_voided?: boolean;
};

export type MyEventsParams = {
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};

// date_from and date_to are REQUIRED by the backend, so they are not optional here
export type ShiftParams = {
  date_from: string;
  date_to: string;
  employee_id?: number;
};

// Bodies we send


export type ClockInput = {
  qr_token: string;
  event_type: EventType;
  request_id: string;
  latitude: number;
  longitude: number;
  accuracy_m: number;
};

export type ManualEventInput = {
  employee_id: number;
  event_type: EventType;
  occurred_at: string;
  reason: string;
};

export type TimeCorrectionInput = { occurred_at: string; reason: string };
export type VoidInput = { reason: string };

