import { api } from "../../../shared/api/http";
import type { Deal } from "../types/deal.tpes";

export function getDeals(token: string, pipelineId: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ pipeline_id: pipelineId, limit: "50", offset: "0" });

    return api<Deal[]>(`/deals?${params.toString()}`, {
        token,
        signal,
    });
}

export function moveDealStage(token: string, dealId: string, stageId: string) {
    return api<Deal>(`/deals/${encodeURIComponent(dealId)}/move-stage`, {
        token,
        method: "POST",
        body: JSON.stringify({ new_stage_id: stageId }),
    });
}
