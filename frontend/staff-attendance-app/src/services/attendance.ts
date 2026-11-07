import { api } from "@/lib/api";

import type { MyStatus, TodayRow } from "@/types/attendance";

export const getMyStatus = ()=> api<MyStatus>("/attendance/me/status")

export const getToday = ()=> api<TodayRow[]>("/attendance/today")