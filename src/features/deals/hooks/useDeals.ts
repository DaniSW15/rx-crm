import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/auth.store";
import { getDeals } from "../api/deals.api";

export function useDeals(pipelineId?: string) {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore(
        (state) => state.user?.tenant_id
    );

    return useQuery({
        queryKey: ["deals", tenantId, pipelineId],
        queryFn: () => {
            if (!token || !pipelineId) throw new Error("Sesión o pipeline no disponible");
            return getDeals(token, pipelineId);
        },
        enabled: Boolean(token && tenantId && pipelineId),
        retry: false,
    });
}
