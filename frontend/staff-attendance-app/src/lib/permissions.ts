import { CalendarDays,ClipboardList,Clock,FileText,LayoutDashboard,MapPin,ScanLine,ScrollText,ShieldCheck,SlidersHorizontal,Users,ListChecks,Wallet,type LucideIcon, } from "lucide-react";

import type { Role } from "@/types/auth";

export type NavGroup = "main" | "manage" | "setup"

export type NavItem = {
    label: string
    href: string
    icon: LucideIcon
    group: NavGroup
    roles: Role[]
}

const everyone: Role[] = ["owner","manager","employee"]
const managers: Role[] = ["owner","manager"]
const ownerOnly: Role[] = ["owner"]


export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard, group: "main", roles: everyone },
  { label: "Scan", href: "/dashboard/scan", icon: ScanLine, group: "main", roles: everyone },
  { label: "My attendance", href: "/dashboard/my-attendance", icon: Clock, group: "main", roles: everyone },
  { label: "My tasks", href: "/dashboard/my-tasks", icon: ListChecks, group: "main", roles: everyone },
  { label: "Employees", href: "/dashboard/employees", icon: Users, group: "manage", roles: managers },
  { label: "Attendance", href: "/dashboard/attendance", icon: CalendarDays, group: "manage", roles: managers },
  { label: "Tasks", href: "/dashboard/tasks", icon: ClipboardList, group: "manage", roles: managers },
  { label: "Payroll", href: "/dashboard/payroll", icon: Wallet, group: "manage", roles: managers },
  { label: "Reports", href: "/dashboard/reports", icon: FileText, group: "manage", roles: managers },
  { label: "Schedules", href: "/dashboard/schedules", icon: ScrollText, group: "setup", roles: managers },
  { label: "Workplaces", href: "/dashboard/workplaces", icon: MapPin, group: "setup", roles: managers },
  { label: "Wage rules", href: "/dashboard/wage-rules", icon: SlidersHorizontal, group: "setup", roles: managers },
  { label: "Audit log", href: "/dashboard/audit-log", icon: ShieldCheck, group: "setup", roles: ownerOnly },
];


export const NAV_GROUP_TITLES: Record<NavGroup, string |  null> = {
    main: null,
    manage: "Manage",
    setup: "Setup"
}


export function navItemsFor(role: Role): NavItem[]{
    return NAV_ITEMS.filter((item)=> item.roles.includes(role))
}

export function isManager(role: Role): boolean{
    return role === "owner" || role === "manager"
}

