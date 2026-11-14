import { api } from "@/lib/api";
import { buildQuery } from "@/lib/query-string";
import type {
  CommentInput,
  CommentListParams,
  MyTask,
  MyTaskListParams,
  Task,
  TaskComment,
  TaskCreateInput,
  TaskListParams,
  TaskStatusInput,
  TaskUpdateInput,
} from "@/types/task";

export function listTasks(params: TaskListParams = {}) {
  return api<Task[]>(`/tasks${buildQuery(params)}`);
}

export function listMyTasks(params: MyTaskListParams = {}) {
  return api<MyTask[]>(`/tasks/me${buildQuery(params)}`);
}

export function getTask(id: number) {
  return api<Task>(`/tasks/${id}`);
}

export function createTask(input: TaskCreateInput) {
  return api<Task>("/tasks", { method: "POST", body: input });
}

export function updateTask(id: number, input: TaskUpdateInput) {
  return api<Task>(`/tasks/${id}`, { method: "PATCH", body: input });
}

export function deleteTask(id: number) {
  return api<void>(`/tasks/${id}`, { method: "DELETE" });
}

export function updateMyTaskStatus(taskId: number, input: TaskStatusInput) {
  return api<MyTask>(`/tasks/${taskId}/status`, { method: "PATCH", body: input });
}

export function listComments(taskId: number, params: CommentListParams = {}) {
  return api<TaskComment[]>(`/tasks/${taskId}/comments${buildQuery(params)}`);
}

export function addComment(taskId: number, input: CommentInput) {
  return api<TaskComment>(`/tasks/${taskId}/comments`, { method: "POST", body: input });
}