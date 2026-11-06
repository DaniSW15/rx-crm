import { z } from "zod";

export const userSchema = z.object({
    id: z.string().min(1),
    tenant_id: z.string().min(1),
    email: z.string().min(1),
    full_name: z.string(),
    role: z.enum(["ADMIN", "DEV", "CLIENTE"]),
    is_active: z.boolean(),
});

export type User = z.infer<typeof userSchema>;
export type Role = User["role"];
