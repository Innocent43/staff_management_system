"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { ScheduleForm } from "@/components/schedules/schedule-form";
import { ScheduleList } from "@/components/schedules/schedule-list";
import { Button } from "@/components/ui/button";
import type { Schedule } from "@/types/schedule";

export default function SchedulesPage() {
  // null = closed, "new" = creating, a Schedule = editing that one
  const [editing, setEditing] = useState<Schedule | "new" | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Schedules</h1>
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New schedule
        </Button>
      </div>

      <ScheduleList onEdit={setEditing} />

      {editing && (
        <ScheduleForm
          schedule={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}