import { ApiError } from "./api";

export function getErrorMessage(error: unknown): string{
    return error instanceof ApiError ? error.message : "Something went wrong. Please try again."
}


