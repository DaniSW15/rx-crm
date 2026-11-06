import { ApiError } from "./http";

export function isAccessError(error: Error | null): boolean {
    return error instanceof ApiError && (error.status === 401 || error.status === 403);
}
