"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { TaskDetail } from "@/components/tasks/task-detail";
export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/tasks"
        className="inline-flex items-center gap-1 text-sm text-navy-600 hover:underline"
      >
        <ArrowLeft className="size-4" /> Tasks
      </Link>
      <TaskDetail id={Number(params.id)} />
    </div>
  );
}