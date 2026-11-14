import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getTask, listComments, listMyTasks, listTasks } from "@/services/tasks";
import type { MyTaskListParams, TaskListParams } from "@/types/task";

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: ["tasks", "list", params],
    queryFn: () => listTasks(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyTasks(params: MyTaskListParams) {
  return useQuery({
    queryKey: ["tasks", "me", params],
    queryFn: () => listMyTasks(params),
    placeholderData: keepPreviousData,
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ["tasks", "detail", id],
    queryFn: () => getTask(id),
  });
}

// 100 is the backend maximum, which is plenty for one task's discussion
export function useComments(taskId: number) {
  return useQuery({
    queryKey: ["tasks", "comments", taskId],
    queryFn: () => listComments(taskId, { limit: 100 }),
  });
}