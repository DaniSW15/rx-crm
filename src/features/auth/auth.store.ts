import { create } from "zustand";

export type Role = "ADMIN" | "DEV" | "CLIENTE";

export interface User {
    id: string;
    tenant_id: string;
    email: string;
    full_name: string;
    role: Role;
    is_active: string;
}

interface AuthState {
    token: string | null;
    user: User | null;

    setSession: (token: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    setSession: (token: string, user: User) => set({ token, user }),
    logout: () => set({ token: null, user: null })
}));