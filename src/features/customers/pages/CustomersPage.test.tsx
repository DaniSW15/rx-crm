import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../auth";
import { customer, jsonResponse, user } from "../../../test/fixtures";
import CustomersPage from "./CustomersPage";

let client: QueryClient;
beforeEach(() => {
    useAuthStore.getState().setSession("token", user);
    client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
});
afterEach(() => {
    client.clear();
    useAuthStore.getState().logout();
});

function renderPage() {
    render(
        <QueryClientProvider client={client}>
            <CustomersPage />
        </QueryClientProvider>,
    );
}

describe("customer directory", () => {
    it("loads the next page and searches only the page indicated by the UI", async () => {
        const page = Array.from({ length: 20 }, (_, id) => ({
            ...customer,
            id: `customer-${id}`,
            name: `Acme ${id}`,
        }));
        const request = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(page))
            .mockResolvedValueOnce(jsonResponse([{ ...customer, name: "Otro cliente" }]));
        vi.stubGlobal("fetch", request);
        renderPage();
        expect(await screen.findByText("Acme 0")).toBeInTheDocument();
        await userEvent.type(screen.getByLabelText("Buscar clientes en esta página"), "Acme 19");
        expect(screen.queryByText("Acme 0")).not.toBeInTheDocument();
        expect(screen.getByText("Acme 19")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
        expect(await screen.findByText("Otro cliente")).toBeInTheDocument();
        expect(request.mock.calls[1][0]).toContain("limit=20&offset=20");
        expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
        expect(screen.getByLabelText("Buscar clientes en esta página")).toHaveValue("");
        expect(request.mock.calls[1][1].headers.get("Authorization")).toBe("Bearer token");
    });

    it.each([401, 403])("hides cached customer data after HTTP %s", async (status) => {
        client.setQueryData(["customers", user.tenant_id, 0, 20], [customer]);
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ detail: "Acceso denegado" }, status)),
        );
        renderPage();
        expect(screen.getByText(customer.name)).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Actualizar" }));
        await waitFor(() => expect(screen.queryByText(customer.name)).not.toBeInTheDocument());
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("rejects a malformed directory instead of rendering a broken table", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse([{ id: "customer-1", name: null }])),
        );
        renderPage();
        expect(await screen.findByRole("alert")).toHaveTextContent("formato inesperado");
        expect(screen.queryByText("Acme")).not.toBeInTheDocument();
    });
});
