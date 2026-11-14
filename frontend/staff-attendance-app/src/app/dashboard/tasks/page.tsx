"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Tasks</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> New task
        </Button>
      </div>

      <TaskList />

      {creating && <TaskForm onClose={() => setCreating(false)} />}
    </div>
  );
}