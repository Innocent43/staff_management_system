import { MyTasks } from "@/components/tasks/my-tasks";

export default function MyTasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy-900">My tasks</h1>
      <MyTasks />
    </div>
  );
}