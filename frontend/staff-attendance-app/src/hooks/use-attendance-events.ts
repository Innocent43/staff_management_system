import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  listCorrections,
  listEvents,
  listMyEvents,
  listShifts,
} from "@/services/attendance";
import type {
  AttendanceListParams,
  MyEventsParams,
  ShiftParams,
} from "@/types/attendance";

export function useEvents(params: AttendanceListParams) {
  return useQuery({
    queryKey: ["attendance", "events", params],
    queryFn: () => listEvents(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyEvents(params: MyEventsParams) {
  return useQuery({
    queryKey: ["attendance", "me", "events", params],
    queryFn: () => listMyEvents(params),
    placeholderData: keepPreviousData,
  });
}

export function useShifts(params: ShiftParams) {
  return useQuery({
    queryKey: ["attendance", "shifts", params],
    queryFn: () => listShifts(params),
    placeholderData: keepPreviousData,
  });
}

export function useCorrections(eventId: number) {
  return useQuery({
    queryKey: ["attendance", "corrections", eventId],
    queryFn: () => listCorrections(eventId),
  });
}