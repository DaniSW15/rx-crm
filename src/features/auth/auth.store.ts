import { create } from "zustand";

import type { User } from "./model/auth.types";
export type { User, Role } from "./model/auth.types";

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
    logout: () => set({ token: null, user: null }),
}));
