import { api } from "../../../shared/api/http";
import type { Pipeline } from "../types/pipeline.types";
import { z } from "zod";

const pipelineSchema: z.ZodType<Pipeline> = z.object({
    id: z.string().min(1),
    name: z.string(),
    is_active: z.boolean(),
    is_default: z.boolean(),
    stages: z.array(
        z.object({
            id: z.string().min(1),
            pipeline_id: z.string().min(1),
            name: z.string(),
            order: z.number(),
            win_probability: z.number(),
            days_until_stale: z.number(),
            is_won_stage: z.boolean(),
            is_lost_stage: z.boolean(),
        }),
    ),
});

export function getPipelines(token: string, signal?: AbortSignal) {
    return api<Pipeline[]>("/pipelines", {
        token,
        signal,
        schema: pipelineSchema.array(),
    });
}
