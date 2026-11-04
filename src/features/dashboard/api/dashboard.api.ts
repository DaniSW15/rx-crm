import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../../../shared/api/http";
import { useAuthStore } from "../../auth/auth.store";
import type { Deal } from "../../deals/types/deal.tpes";

export interface CurrencyAmounts {
    currency: string;
    open_amount: string;
    won_amount: string;
    lost_amount: string;
    total_amount: string;
}

export interface CrmSummary {
    total_customers: number;
    total_opportunities: number;
    open_opportunities: number;
    won_opportunities: number;
    lost_opportunities: number;
    amounts_by_currency: CurrencyAmounts[];
}

export function useCrmSummary() {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    return useQuery({ queryKey: ["crm-summary", tenantId],
        queryFn: ({ signal }) => api<CrmSummary>("/analytics/summary/", { token: token ?? undefined, signal }),
        enabled: Boolean(token && tenantId), retry: false });
}

export function useRecentDeals() {
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    return useQuery({ queryKey: ["recent-deals", tenantId],
        queryFn: ({ signal }) => api<Deal[]>("/deals?limit=5&offset=0", { token: token ?? undefined, signal }),
        enabled: Boolean(token && tenantId), retry: false });
}

export function isAccessError(error: Error | null) {
    return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function formatMoney(value: string | number | undefined, currency: string) {
    if (value === undefined) return "—";
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    try { return new Intl.NumberFormat("es-MX", { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(amount); }
    catch { return `${amount.toLocaleString("es-MX")} ${currency}`; }
}
