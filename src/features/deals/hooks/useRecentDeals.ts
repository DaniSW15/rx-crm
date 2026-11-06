import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth";
import { getRecentDeals } from "../api/deals.api";

export function useRecentDeals() {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    return useQuery({
        queryKey: ["recent-deals", tenantId],
        queryFn: ({ signal }) => {
            if (!token || !tenantId) throw new Error("No existe una sesión activa");
            return getRecentDeals(token, signal);
        },
        enabled: Boolean(token && tenantId),
        retry: false,
    });
}
