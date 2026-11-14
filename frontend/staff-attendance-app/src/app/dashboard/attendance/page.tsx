"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { useBusinessTimezone } from "@/hooks/use-business-timezone";
import { EventsPanel } from "@/components/attendance/events-panel";
import { ManualEntryDialog } from "@/components/attendance/manual-entry-dialog";
import { ShiftsPanel } from "@/components/attendance/shifts-panel";
import { TodayBoard } from "@/components/attendance/today-board";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";

type TabValue = "today" | "shifts" | "events";

const TABS: { value: TabValue; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "shifts", label: "Shifts" },
  { value: "events", label: "Events" },
];

export default function AttendancePage() {
  const [tab, setTab] = useState<TabValue>("today");
  const [adding, setAdding] = useState(false);
    // const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; 
    const timezone = useBusinessTimezone()


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Attendance</h1>
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add entry
        </Button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

 {/* needs attention */}
      {tab === "today" && <TodayBoard timezone={timezone}/>}   
      {tab === "shifts" && <ShiftsPanel />}
      {tab === "events" && <EventsPanel />}

      {adding && <ManualEntryDialog onClose={() => setAdding(false)} />}
    </div>
  );
}