export type PresenceStatus = "clocked_in" | "clocked_out" | "not_in"


export type TodayRow = {
    employee_id: number
    employee_name: string
    status: PresenceStatus
    since: string | null
    late_minutes: number
}


export type MyStatus = {
    clocked_in: boolean
    since: string | null
}


