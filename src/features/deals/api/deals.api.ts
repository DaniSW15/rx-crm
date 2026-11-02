import { api } from "../../../shared/api/http";
import type { Deal } from "../types/deal.tpes";

export function getDeals(token: string, pipelineId: string) {
    const params = new URLSearchParams({ pipeline_id: pipelineId, limit: "50", offset: "0" });

    return api<Deal[]>(`/deals?${params.toString()}`, {
        token,
    });
}