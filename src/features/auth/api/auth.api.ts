import { api } from "../../../shared/api/http";
import { z } from "zod";
import { userSchema, type User } from "../model/auth.types";

const loginSchema = z.object({ access_token: z.string().min(1) });

export async function loginSession(
    email: string,
    password: string,
): Promise<{ token: string; user: User }> {
    const session = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        schema: loginSchema,
    });

    const user = await api<User>(`/auth/me`, {
        token: session.access_token,
        schema: userSchema,
    });

    if (!user.is_active) throw new Error("Esta cuenta está inactiva. Contacta al administrador.");
    return { token: session.access_token, user };
}

export function revokeSession(token: string, signal?: AbortSignal): Promise<void> {
    return api<void>("/auth/logout/", { method: "POST", token, signal });
}
