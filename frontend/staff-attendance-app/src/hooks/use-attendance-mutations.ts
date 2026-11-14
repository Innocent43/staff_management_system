import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addManualEvent,
  clockAttendance,
  correctEventTime,
  voidEvent,
} from "@/services/attendance";
import type { TimeCorrectionInput, VoidInput } from "@/types/attendance";

// Every attendance query key starts with "attendance", so ONE call refreshes
// the today board, shifts, events, my events and the clock status together.
function useRefreshAttendance() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["attendance"] });
}

export function useClock() {
  const refresh = useRefreshAttendance();
  return useMutation({ mutationFn: clockAttendance, onSuccess: refresh });
}

export function useAddManualEvent() {
  const refresh = useRefreshAttendance();
  return useMutation({ mutationFn: addManualEvent, onSuccess: refresh });
}

export function useCorrectEvent(eventId: number) {
  const refresh = useRefreshAttendance();
  return useMutation({
    mutationFn: (input: TimeCorrectionInput) => correctEventTime(eventId, input),
    onSuccess: refresh,
  });
}

export function useVoidEvent(eventId: number) {
  const refresh = useRefreshAttendance();
  return useMutation({
    mutationFn: (input: VoidInput) => voidEvent(eventId, input),
    onSuccess: refresh,
  });
}