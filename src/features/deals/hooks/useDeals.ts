import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../auth";
import { DEAL_PAGE_SIZE, getDeals } from "../api/deals.api";
import { dealKeys } from "../api/dealKeys";
import { flattenDeals } from "./dealCache";

export function useDeals(pipelineId?: string) {
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);

    return useInfiniteQuery({
        queryKey: dealKeys.list(tenantId, pipelineId),
        queryFn: ({ signal, pageParam }) => {
            if (!token || !pipelineId) throw new Error("Sesión o pipeline no disponible");
            return getDeals(token, pipelineId, signal, pageParam);
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, _pages, offset) =>
            lastPage.length === DEAL_PAGE_SIZE ? offset + DEAL_PAGE_SIZE : undefined,
        select: flattenDeals,
        enabled: Boolean(token && tenantId && pipelineId),
        retry: false,
        refetchOnWindowFocus: () =>
            queryClient.isMutating({ mutationKey: ["move-deal", tenantId, pipelineId] }) === 0,
        refetchOnReconnect: () =>
            queryClient.isMutating({ mutationKey: ["move-deal", tenantId, pipelineId] }) === 0,
    });
}
