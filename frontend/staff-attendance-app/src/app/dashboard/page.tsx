"use client";

import { ClockCard } from "@/components/attendance/clock-card";
import { TodayBoard } from "@/components/attendance/today-board";
import { TodaySummary } from "@/components/home/today-summary";
import { useMe } from "@/hooks/use-me";
import { isManager } from "@/lib/permissions";

export default function DashboardHomePage() {
  const { data: me } = useMe();

  if (!me) return null;
  const timezone = me.business.timezone;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Welcome, {me.user.full_name}</h1>

      <ClockCard timezone={timezone} />

      {isManager(me.role) && (
        <>
          <TodaySummary />
          <TodayBoard timezone={timezone} />
        </>
      )}
    </div>
  );
}