import { useQuery } from "@tanstack/react-query";
import { api } from "../../../shared/api/http";
import { useAuthStore } from "../../auth/auth.store";

export interface Customer {
    id: string;
    tenant_id: string;
    name: string;
    industry: string | null;
    website: string | null;
    phone: string | null;
    annual_revenue: string | null;
    owner_id: string | null;
    custom_fields: Record<string, unknown>;
}

export function useCustomers(page = 0, limit = 20) {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    return useQuery({ queryKey: ["customers", tenantId, page, limit],
        queryFn: ({ signal }) => api<Customer[]>(`/customers/?limit=${limit}&offset=${page * limit}`, { token: token ?? undefined, signal }),
        enabled: Boolean(token && tenantId), retry: false });
}
