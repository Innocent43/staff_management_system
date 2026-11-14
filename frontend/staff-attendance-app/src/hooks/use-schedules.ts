import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  updateSchedule,
} from "@/services/schedules";
import type { Schedule, ScheduleInput } from "@/types/schedule";

export function useSchedules() {
  return useQuery({ queryKey: ["schedules"], queryFn: listSchedules });
}

// One hook for both: pass a schedule to edit it, or nothing to create
export function useSaveSchedule(schedule?: Schedule) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleInput) =>
      schedule ? updateSchedule(schedule.id, input) : createSchedule(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      // employees pointing at this schedule changed too
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}