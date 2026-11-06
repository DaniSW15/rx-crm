import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth";
import { getCrmSummary } from "../api/dashboard.api";

export function useCrmSummary() {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    return useQuery({
        queryKey: ["crm-summary", tenantId],
        queryFn: ({ signal }) => {
            if (!token || !tenantId) throw new Error("No existe una sesión activa");
            return getCrmSummary(token, signal);
        },
        enabled: Boolean(token && tenantId),
        retry: false,
    });
}
