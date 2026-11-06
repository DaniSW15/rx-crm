import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, user } from "../../../test/fixtures";
import { useAuthStore } from "../auth.store";
import LoginPage from "./LoginPage";

let client: QueryClient;
beforeEach(() => {
    client = new QueryClient();
    useAuthStore.getState().logout();
});
afterEach(() => {
    client.clear();
    useAuthStore.getState().logout();
});

function renderLogin() {
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={<p>Dashboard privado</p>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

async function submit() {
    const keyboard = userEvent.setup();
    await keyboard.type(screen.getByLabelText("Correo electrónico"), user.email);
    await keyboard.type(screen.getByLabelText("Contraseña"), "password");
    await keyboard.click(screen.getByRole("button", { name: /Entrar a mi espacio/ }));
}

describe("LoginPage", () => {
    it("stores the validated session, clears previous cache and opens the dashboard", async () => {
        client.setQueryData(["old-private-data"], ["old tenant"]);
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ access_token: "token" }))
                .mockResolvedValueOnce(jsonResponse(user)),
        );
        renderLogin();
        await submit();
        expect(await screen.findByText("Dashboard privado")).toBeInTheDocument();
        expect(useAuthStore.getState().user).toEqual(user);
        expect(client.getQueryData(["old-private-data"])).toBeUndefined();
        expect(localStorage.getItem("token")).toBeNull();
    });

    it("keeps the user out when FastAPI rejects credentials", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ detail: "Credenciales inválidas" }, 401)),
        );
        renderLogin();
        await submit();
        expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");
        expect(useAuthStore.getState().token).toBeNull();
        await waitFor(() =>
            expect(screen.getByRole("button", { name: /Entrar a mi espacio/ })).toBeEnabled(),
        );
    });
});
