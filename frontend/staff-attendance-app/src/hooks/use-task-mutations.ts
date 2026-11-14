import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addComment,
  createTask,
  deleteTask,
  updateMyTaskStatus,
  updateTask,
} from "@/services/tasks";
import type { CommentInput, Task, TaskCreateInput, TaskStatus } from "@/types/task";

function useRefreshTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["tasks"] });
}

// No task passed = create. A task passed = edit it.
export function useSaveTask(task?: Task) {
  const refresh = useRefreshTasks();
  return useMutation({
    mutationFn: (input: TaskCreateInput) =>
      task ? updateTask(task.id, input) : createTask(input),
    onSuccess: refresh,
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask, // called as mutate(taskId)
    onSuccess: () =>
      // Refresh the lists, but NOT the detail query. The task no longer exists,
      // so refetching it would return 404 for a moment before we leave the page.
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["tasks", "me"] }),
      ]),
  });
}

// mutate() accepts ONE argument, so two values travel together in an object
type StatusChange = { taskId: number; status: TaskStatus };

export function useUpdateMyStatus() {
  const refresh = useRefreshTasks();
  return useMutation({
    mutationFn: ({ taskId, status }: StatusChange) => updateMyTaskStatus(taskId, { status }),
    onSuccess: refresh,
  });
}

export function useAddComment(taskId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CommentInput) => addComment(taskId, input),
    // a new comment only changes THIS task's thread, so only refresh that
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tasks", "comments", taskId] }),
  });
}