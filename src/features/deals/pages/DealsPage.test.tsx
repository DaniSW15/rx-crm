import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../auth/auth.store";
import { deal, deferred, jsonResponse, pipeline, user } from "../../../test/fixtures";
import { dealKeys } from "../api/dealKeys";
import DealsPage from "./DealsPage";

let client: QueryClient;
const pipelinesKey = ["pipelines", user.tenant_id];
const dealsKey = dealKeys.list(user.tenant_id, pipeline.id);

function renderPage() {
    return render(<QueryClientProvider client={client}><DealsPage /></QueryClientProvider>);
}

beforeEach(() => {
    useAuthStore.getState().setSession("test-token", user);
    client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
});

afterEach(() => {
    client.clear();
    useAuthStore.getState().logout();
});

describe("DealsPage", () => {
    it("requires a session without querying private data", () => {
        useAuthStore.getState().logout();
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        renderPage();
        expect(screen.getByRole("link", { name: "Iniciar sesión" })).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows loading until the pipeline request finishes", async () => {
        const response = deferred<Response>();
        vi.stubGlobal("fetch", vi.fn().mockReturnValue(response.promise));
        renderPage();
        expect(screen.getByRole("status")).toHaveTextContent("Cargando embudos");
        response.resolve(jsonResponse([]));
        expect(await screen.findByText(/No hay embudos comerciales registrados/)).toBeInTheDocument();
    });

    it("refreshes an empty pipeline list and then loads opportunities", async () => {
        client.setQueryData(pipelinesKey, []);
        const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(
            jsonResponse(url.includes("pipelines") ? [pipeline] : [deal]),
        ));
        vi.stubGlobal("fetch", fetchMock);
        renderPage();
        await userEvent.click(screen.getByRole("button", { name: "Actualizar embudos" }));
        expect(await screen.findByRole("heading", { name: deal.title })).toBeInTheDocument();
        expect(screen.getByText("1 oportunidad cargada")).toBeInTheDocument();
    });

    it("explains when all existing pipelines are inactive", () => {
        client.setQueryData(pipelinesKey, [{ ...pipeline, is_active: false }]);
        renderPage();
        expect(screen.getByText(/No hay embudos comerciales activos/)).toBeInTheDocument();
    });

    it("retains cached cards if a background refresh fails temporarily", async () => {
        client.setQueryData(pipelinesKey, [pipeline]);
        client.setQueryData(dealsKey, [deal]);
        vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => jsonResponse({ detail: "Servicio temporalmente no disponible" }, 503)));
        renderPage();
        await userEvent.click(screen.getByRole("button", { name: "Actualizar tablero" }));
        await screen.findAllByRole("alert");
        expect(screen.getByRole("heading", { name: deal.title })).toBeInTheDocument();
        expect(screen.getAllByText("Servicio temporalmente no disponible").length).toBeGreaterThan(0);
    });

    it.each([401, 403])("hides cached opportunities when the API denies access with HTTP %s", async (status) => {
        client.setQueryData(pipelinesKey, [pipeline]);
        client.setQueryData(dealsKey, [deal]);
        vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => jsonResponse({ detail: "Acceso rechazado" }, status)));
        renderPage();
        await userEvent.click(screen.getByRole("button", { name: "Actualizar tablero" }));
        await screen.findByRole("alert");
        expect(screen.queryByRole("heading", { name: deal.title })).not.toBeInTheDocument();
        if (status === 401) expect(screen.getByRole("link", { name: "Iniciar sesión" })).toBeInTheDocument();
    });

    it("locks refresh and pipeline selection while a move is pending", async () => {
        client.setQueryData(pipelinesKey, [pipeline]);
        client.setQueryData(dealsKey, [deal]);
        renderPage();
        const pending = deferred<void>();
        const mutation = client.getMutationCache().build(client, {
            mutationKey: dealKeys.move(user.tenant_id, pipeline.id), mutationFn: () => pending.promise,
        });
        let movement!: Promise<void>;
        act(() => { movement = mutation.execute(undefined); });
        await waitFor(() => expect(screen.getByRole("button", { name: "Actualizar tablero" })).toBeDisabled());
        expect(screen.getByRole("combobox", { name: "Embudo comercial" })).toBeDisabled();
        await act(async () => { pending.resolve(); await movement; });
        await waitFor(() => expect(screen.getByRole("button", { name: "Actualizar tablero" })).toBeEnabled());
    });
});
