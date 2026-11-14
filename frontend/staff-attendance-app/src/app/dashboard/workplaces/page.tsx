"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { WorkplaceForm } from "@/components/workplaces/workplace-form";
import { WorkplaceList } from "@/components/workplaces/workplace-list";
import { Button } from "@/components/ui/button";
import type { Workplace } from "@/types/workplaces";


export default function WorkplacesPage() {
  // null = closed, "new" = creating, a Workplace = renaming that one
  const [editing, setEditing] = useState<Workplace | "new" | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Workplaces</h1>
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New workplace
        </Button>
      </div>

      <WorkplaceList onEdit={setEditing} />

      {editing && (
        <WorkplaceForm
          workplace={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}