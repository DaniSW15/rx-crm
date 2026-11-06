import { z } from "zod";

export const customerSchema = z.object({
    id: z.string().min(1),
    tenant_id: z.string().min(1),
    name: z.string(),
    industry: z.string().nullable(),
    website: z.string().nullable(),
    phone: z.string().nullable(),
    annual_revenue: z.string().nullable(),
    owner_id: z.string().nullable(),
    custom_fields: z.record(z.string(), z.unknown()),
});
export type Customer = z.infer<typeof customerSchema>;
