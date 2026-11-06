import { api } from "../../../shared/api/http";
import { dealSchema } from "./deal.schema";

export const DEAL_PAGE_SIZE = 50;

export function getDeals(token: string, pipelineId: string, signal?: AbortSignal, offset = 0) {
    const params = new URLSearchParams({
        pipeline_id: pipelineId,
        limit: String(DEAL_PAGE_SIZE),
        offset: String(offset),
    });
    return api(`/deals?${params}`, { token, signal, schema: dealSchema.array() });
}

export function getRecentDeals(token: string, signal?: AbortSignal) {
    return api("/deals?limit=5&offset=0", { token, signal, schema: dealSchema.array() });
}

export function moveDealStage(token: string, dealId: string, stageId: string) {
    return api(`/deals/${encodeURIComponent(dealId)}/move-stage`, {
        token,
        method: "POST",
        body: JSON.stringify({ new_stage_id: stageId }),
        schema: dealSchema,
    });
}
