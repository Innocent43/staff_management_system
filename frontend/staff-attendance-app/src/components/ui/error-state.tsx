import { Alert } from "./alert";
import { Button } from "./button";

type ErrorStateProps = {
    message?: string
    onRetry?: () => void
}


export function ErrorState({
    message = "Something went wrong. Please try again.",
    onRetry,
}: ErrorStateProps){
    return (
        <div className="space-y-3">
            <Alert>{message}</Alert>
            {onRetry && (
                <Button variant="secondary" onClick={onRetry}>Try again</Button>
            )}
        </div>
    )
}