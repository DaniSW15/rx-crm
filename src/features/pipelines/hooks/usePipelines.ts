import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth";
import { getPipelines } from "../api/pipeline.api";

export function usePipelines() {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    return useQuery({
        queryKey: ["pipelines", tenantId],
        queryFn: ({ signal }) => {
            if (!token || !tenantId) throw new Error("No existe una sesión activa");
            return getPipelines(token, signal);
        },
        enabled: Boolean(token && tenantId),
        retry: false,
    });
}
