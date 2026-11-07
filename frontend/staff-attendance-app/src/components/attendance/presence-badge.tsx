import { Badge, type BadgeVariant } from "../ui/badge";

import type { PresenceStatus } from "@/types/attendance";

const presence: Record<PresenceStatus, {label: string; variant: BadgeVariant}> = {
    clocked_in: {label: "Clocked in", variant: "progress"},
    clocked_out: {label: "Clocked out", variant: "good"},
    not_in: {label: "Not in", variant: "neutral"}
}


export function PresenceBadge({status}: {status: PresenceStatus}){
    const {label,variant} = presence[status]
    return <Badge variant={variant}>{label}</Badge>
}