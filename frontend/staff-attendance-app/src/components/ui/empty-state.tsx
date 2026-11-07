import { ReactNode } from "react";

type EmptyStateProps = {
    title: string
    text?: string
    action?: ReactNode
}


export function EmptyState({title,text,action}: EmptyStateProps){
    return (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="font-semibold text-navy-900">{title}</p>
            {text && <p className="max-w-sm text-sm text-navy-600">{text}</p>}
            {action}
        </div>
    )
}