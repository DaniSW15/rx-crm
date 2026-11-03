import { api } from "../../../shared/api/http";
import type { User } from "../auth.store";

interface LoginResponse {
    access_token: string;
    token_type: string;
    user_id: string;
    tenant_id: string;
    email: string;
    first_name: string;
    role: string;
}

export async function loginSession(email: string, password: string): Promise<{ token: string; user: User }> {
    const session = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

    const user = await api<User>(`/auth/me`, {
        token: session.access_token,
    });

    return { token: session.access_token, user };
}