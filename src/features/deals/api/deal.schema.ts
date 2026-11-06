import { z } from "zod";
import type { Deal } from "../types/deal.types";

export const dealSchema: z.ZodType<Deal> = z.object({
    id: z.string().min(1),
    tenant_id: z.string().min(1),
    title: z.string(),
    amount: z.string().regex(/^-?\d+(\.\d+)?$/),
    currency: z.string().min(1),
    pipeline_id: z.string().min(1),
    stage_id: z.string().min(1),
    owner_id: z.string().min(1),
    status: z.enum(["OPEN", "WON", "LOST"]),
    account_id: z.string().nullable(),
    contact_id: z.string().nullable(),
    expected_close_date: z.string().nullable(),
    actual_close_date: z.string().nullable(),
    lost_reason: z.string().nullable(),
    custom_fields: z.record(z.string(), z.unknown()),
});
