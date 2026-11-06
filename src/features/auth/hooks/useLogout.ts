import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useAuthStore } from "../auth.store";
import { revokeSession } from "../api/auth.api";
import { ApiError } from "../../../shared/api/http";

export type LogoutStatus = "pending" | "closed" | "unconfirmed";

export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return async function logout() {
        const token = useAuthStore.getState().token;
        // Clear access immediately, including when the server is slow or unreachable.
        useAuthStore.getState().logout();
        queryClient.clear();
        navigate("/login", { replace: true, state: { logoutStatus: "pending" } });
        let logoutStatus: LogoutStatus = "closed";
        try {
            if (token) await revokeSession(token, AbortSignal.timeout(8_000));
        } catch (error) {
            if (!(error instanceof ApiError && error.status === 401)) logoutStatus = "unconfirmed";
        }
        // A late response must not navigate away from a newly authenticated session.
        if (!useAuthStore.getState().token) {
            navigate("/login", { replace: true, state: { logoutStatus } });
        }
    };
}
