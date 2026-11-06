import { api } from "../../../shared/api/http";
import { customerSchema } from "../model/customer";

export const CUSTOMER_PAGE_SIZE = 20;

export function getCustomers(
    token: string,
    page = 0,
    limit = CUSTOMER_PAGE_SIZE,
    signal?: AbortSignal,
) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    return api(`/customers/?${params}`, { token, signal, schema: customerSchema.array() });
}
