import { api } from "../../../shared/api/http";
import type { Pipeline } from "../tyes/pipeline.types";

export function getPipelines(token: string) {
    return api<Pipeline[]>("/pipelines", {
        token,
    });
}