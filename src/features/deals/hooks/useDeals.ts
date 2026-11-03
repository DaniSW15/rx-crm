import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "../../auth/auth.store";
import { getDeals } from "../api/deals.api";
import { dealKeys } from "../api/dealKeys";

export function useDeals(pipelineId?: string) {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore(
        (state) => state.user?.tenant_id
    );

    return useQuery({
        queryKey: dealKeys.list(tenantId, pipelineId),
        queryFn: ({ signal }) => {
            if (!token || !pipelineId) throw new Error("Sesión o pipeline no disponible");
            return getDeals(token, pipelineId, signal);
        },
        enabled: Boolean(token && tenantId && pipelineId),
        retry: false,
    });
}
