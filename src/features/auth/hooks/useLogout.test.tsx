import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deal, dealPages, deferred, jsonResponse, pipeline, user } from "../../../test/fixtures";
import { useAuthStore } from "../auth.store";
import { useLogout } from "./useLogout";
import { useMoveDeal, dealKeys } from "../../deals";

let client: QueryClient;
const key = dealKeys.list(user.tenant_id, pipeline.id);

function SessionControls() {
    const logout = useLogout();
    const move = useMoveDeal(pipeline);
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <>
            <button onClick={() => void logout()}>Salir</button>
            <button onClick={() => move.mutate({ dealId: deal.id, stageId: "stage-won" })}>
                Mover
            </button>
            <button
                onClick={() => {
                    useAuthStore.getState().setSession("new-token", user);
                    navigate("/dashboard");
                }}
            >
                Nueva sesión
            </button>
            <p role="status">
                {location.pathname}:{location.state?.logoutStatus}
            </p>
        </>
    );
}

beforeEach(() => {
    useAuthStore.getState().setSession("test-token", user);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(key, dealPages([deal]));
});
afterEach(() => {
    client.clear();
    useAuthStore.getState().logout();
});

function renderControls() {
    render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/deals"]}>
                <SessionControls />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe("remote logout", () => {
    it("clears local access immediately, revokes the captured token and confirms only after 204", async () => {
        const response = deferred<Response>();
        const request = vi.fn().mockReturnValue(response.promise);
        vi.stubGlobal("fetch", request);
        renderControls();
        await userEvent.click(screen.getByRole("button", { name: "Salir" }));
        expect(useAuthStore.getState().token).toBeNull();
        expect(client.getQueryCache().getAll()).toHaveLength(0);
        expect(screen.getByRole("status")).toHaveTextContent("/login:pending");
        expect(request.mock.calls[0][0]).toBe("/api/v1/auth/logout/");
        expect(request.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer test-token");
        expect(request.mock.calls[0][1].method).toBe("POST");
        response.resolve(new Response(null, { status: 204 }));
        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("/login:closed"));
    });

    it.each([new TypeError("offline"), new DOMException("timeout", "TimeoutError")])(
        "reports unconfirmed revocation after transport failure",
        async (error) => {
            vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
            renderControls();
            await userEvent.click(screen.getByRole("button", { name: "Salir" }));
            await waitFor(() =>
                expect(screen.getByRole("status")).toHaveTextContent("unconfirmed"),
            );
            expect(useAuthStore.getState().token).toBeNull();
            expect(client.getQueryCache().getAll()).toHaveLength(0);
        },
    );

    it("treats a token already rejected with 401 as closed", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ detail: "Token inválido" }, 401)),
        );
        renderControls();
        await userEvent.click(screen.getByRole("button", { name: "Salir" }));
        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("closed"));
    });

    it("does not recreate private cache when a pending move finishes after logout", async () => {
        const move = deferred<Response>();
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockImplementation((url: string) =>
                    url.includes("move-stage")
                        ? move.promise
                        : Promise.resolve(new Response(null, { status: 204 })),
                ),
        );
        renderControls();
        await userEvent.click(screen.getByRole("button", { name: "Mover" }));
        await waitFor(() => expect(client.isMutating()).toBe(1));
        await userEvent.click(screen.getByRole("button", { name: "Salir" }));
        await act(async () => {
            move.resolve(jsonResponse({ ...deal, stage_id: "stage-won" }));
        });
        expect(client.getQueryCache().getAll()).toHaveLength(0);
        expect(useAuthStore.getState().token).toBeNull();
    });

    it("does not redirect a new session when the old revocation finishes", async () => {
        const response = deferred<Response>();
        vi.stubGlobal("fetch", vi.fn().mockReturnValue(response.promise));
        renderControls();
        await userEvent.click(screen.getByRole("button", { name: "Salir" }));
        await userEvent.click(screen.getByRole("button", { name: "Nueva sesión" }));
        await act(async () => {
            response.resolve(new Response(null, { status: 204 }));
        });
        expect(screen.getByRole("status")).toHaveTextContent("/dashboard:");
        expect(useAuthStore.getState().token).toBe("new-token");
    });
});
