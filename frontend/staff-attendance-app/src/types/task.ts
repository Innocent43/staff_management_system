export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

// One person's share of a task. Each assignee has their OWN status.
export type Assignment = {
  id: number;
  employee_id: number;
  employee_name: string;
  status: TaskStatus;
  completed_at: string | null;
};

// TaskOut: the manager's view of a task, with everyone assigned to it
export type Task = {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: TaskPriority;
  created_at: string;
  assignments: Assignment[];
};

// MyTaskOut: the employee's flat view, with only THEIR status
export type MyTask = {
  task_id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
};

// "Comment" already exists in the browser's built-in types, so we name ours differently
export type TaskComment = {
  id: number;
  task_id: number;
  body: string;
  created_at: string;
  author_name: string;
};

export type TaskListParams = {
  status?: TaskStatus;
  employee_id?: number;
  priority?: TaskPriority;
  overdue?: boolean;
  search?: string;
  deadline_from?: string;
  deadline_to?: string;
  limit?: number;
  offset?: number;
};

export type MyTaskListParams = {
  status?: TaskStatus;
  limit?: number;
  offset?: number;
};

export type CommentListParams = { limit?: number; offset?: number };

export type TaskCreateInput = {
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
  assignee_ids: number[];
};

// Partial<T> = the same type with every field optional (PATCH sends only changes)
export type TaskUpdateInput = Partial<TaskCreateInput>;

export type TaskStatusInput = { status: TaskStatus };
export type CommentInput = { body: string };