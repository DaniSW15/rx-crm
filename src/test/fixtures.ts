import type { User } from "../features/auth/auth.store";
import type { Deal } from "../features/deals/types/deal.tpes";
import type { Pipeline } from "../features/pipelines/tyes/pipeline.types";

export const user: User = {
    id: "user-1", tenant_id: "tenant-1", email: "admin@example.com",
    full_name: "Admin", role: "ADMIN", is_active: "true",
};

export const pipeline: Pipeline = {
    id: "pipeline-1", name: "Ventas", is_active: true, is_default: true,
    stages: [
        { id: "stage-open", name: "Prospección", is_won_stage: false, is_lost_stage: false },
        { id: "stage-won", name: "Ganado", is_won_stage: true, is_lost_stage: false },
        { id: "stage-lost", name: "Perdido", is_won_stage: false, is_lost_stage: true },
    ].map((stage, index) => ({
        ...stage, pipeline_id: "pipeline-1", order: index,
        win_probability: 0, days_until_stale: 14,
    })),
};

export const deal: Deal = {
    id: "deal-1", tenant_id: user.tenant_id, pipeline_id: pipeline.id,
    stage_id: "stage-open", title: "Licencia Acme", amount: "15000.00",
    currency: "USD", owner_id: user.id, status: "OPEN",
    account_id: null, contact_id: null, expected_close_date: null,
    actual_close_date: null, lost_reason: null, custom_fields: {},
};

export function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

export function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status, headers: { "Content-Type": "application/json" },
    });
}
