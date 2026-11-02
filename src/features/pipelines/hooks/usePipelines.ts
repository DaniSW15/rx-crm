import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/auth.store";
import { getPipelines } from "../api/pipeline.api";

export function usePipelines() {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);

    return useQuery({
        queryKey: ["pipelines", tenantId],
        queryFn: () => {
            if (!token) throw new Error("No existe una sesión activa");

            return getPipelines(token);
        },
        enabled: Boolean(token && tenantId),
        retry: false,
    });
}