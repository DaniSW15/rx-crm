import { api } from "../../../shared/api/http";
import { summarySchema } from "../model/summary";

export function getCrmSummary(token: string, signal?: AbortSignal) {
    return api("/analytics/summary/", { token, signal, schema: summarySchema });
}
