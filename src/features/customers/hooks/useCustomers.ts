import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth";
import { CUSTOMER_PAGE_SIZE, getCustomers } from "../api/customers.api";

export function useCustomers(page = 0, limit = CUSTOMER_PAGE_SIZE) {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    return useQuery({
        queryKey: ["customers", tenantId, page, limit],
        queryFn: ({ signal }) => {
            if (!token || !tenantId) throw new Error("No existe una sesión activa");
            return getCustomers(token, page, limit, signal);
        },
        enabled: Boolean(token && tenantId),
        retry: false,
    });
}
