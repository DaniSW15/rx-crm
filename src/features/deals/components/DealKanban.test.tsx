import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../auth";
import { deal, dealPages, deferred, jsonResponse, pipeline, user } from "../../../test/fixtures";
import { dealKeys } from "../api/dealKeys";
import { useDeals } from "../hooks/useDeals";
import DealKanban from "./DealKanban";

let client: QueryClient;
const queryKey = dealKeys.list(user.tenant_id, pipeline.id);

function Board() {
    const query = useDeals(pipeline.id);
    return <DealKanban pipeline={pipeline} deals={query.data ?? []} />;
}

function renderBoard() {
    return render(
        <QueryClientProvider client={client}>
            <Board />
        </QueryClientProvider>,
    );
}

function column(name: string) {
    return screen.getByRole("region", { name });
}

async function takeCard() {
    const keyboard = userEvent.setup();
    const handle = screen.getByRole("button", { name: `Mover ${deal.title}` });
    act(() => handle.focus());
    await keyboard.keyboard("[Space]");
    await waitFor(() => expect(handle).toHaveAttribute("aria-pressed", "true"));
    return keyboard;
}

beforeEach(() => {
    useAuthStore.getState().setSession("test-token", user);
    client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    client.setQueryData(queryKey, dealPages([deal]));

    // JSDOM has no layout: give the real dnd-kit sensors realistic column/card rectangles.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
        this: HTMLElement,
    ) {
        const section = this.closest("[data-stage-id]");
        const stageIndex = pipeline.stages.findIndex(
            (stage) => stage.id === section?.getAttribute("data-stage-id"),
        );
        const x = Math.max(stageIndex, 0) * 320;
        return new DOMRect(
            x,
            this === section ? 0 : 80,
            this === section ? 280 : 240,
            this === section ? 400 : 160,
        );
    });
});

afterEach(() => {
    client.clear();
    useAuthStore.getState().logout();
});

describe("DealKanban drag and drop with real dnd-kit sensors", () => {
    it("moves into an empty column using the keyboard, then shows the confirmed server state", async () => {
        const response = deferred<Response>();
        const serverDeal = { ...deal, stage_id: "stage-won", status: "OPEN" };
        const fetchMock = vi
            .fn()
            .mockImplementation((_url, options) =>
                options.method === "POST"
                    ? response.promise
                    : Promise.resolve(jsonResponse([serverDeal])),
            );
        vi.stubGlobal("fetch", fetchMock);
        renderBoard();
        expect(within(column("Ganado")).getByText("Sin oportunidades")).toBeInTheDocument();
        const keyboard = await takeCard();
        await keyboard.keyboard("[ArrowRight]");
        await waitFor(() => expect(column("Ganado")).toHaveStyle({ outline: "2px solid #2563eb" }));
        await keyboard.keyboard("[Space]");

        await waitFor(() =>
            expect(
                within(column("Ganado")).getByRole("heading", { name: deal.title }),
            ).toBeInTheDocument(),
        );
        expect(
            within(column("Prospección")).queryByRole("heading", { name: deal.title }),
        ).not.toBeInTheDocument();
        expect(screen.getByText("Guardando movimiento...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: `Mover ${deal.title}` })).toHaveAttribute(
            "aria-disabled",
            "true",
        );
        expect(within(column("Ganado")).getByText("Estado: OPEN")).toBeInTheDocument();
        expect(
            fetchMock.mock.calls.filter(([, options]) => options.method === "POST"),
        ).toHaveLength(1);

        response.resolve(jsonResponse(serverDeal));
        await waitFor(() =>
            expect(screen.getByText("Movimiento guardado en Ganado.")).toBeInTheDocument(),
        );
        expect(within(column("Ganado")).getByText("Estado: OPEN")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: `Mover ${deal.title}` })).toBeEnabled();
        expect(screen.getByRole("button", { name: `Mover ${deal.title}` })).toHaveAttribute(
            "aria-disabled",
            "false",
        );
        await waitFor(() =>
            expect(screen.getByRole("button", { name: `Mover ${deal.title}` })).toHaveFocus(),
        );
    });

    it("restores the original column, reports a FastAPI rejection and allows retry", async () => {
        const response = deferred<Response>();
        const fetchMock = vi
            .fn()
            .mockImplementation((_url, options) =>
                options.method === "POST"
                    ? response.promise
                    : Promise.resolve(jsonResponse([deal])),
            );
        vi.stubGlobal("fetch", fetchMock);
        renderBoard();
        const keyboard = await takeCard();
        await keyboard.keyboard("[ArrowRight]");
        await waitFor(() => expect(column("Ganado")).toHaveStyle({ outline: "2px solid #2563eb" }));
        await keyboard.keyboard("[Enter]");
        await waitFor(() =>
            expect(
                within(column("Ganado")).getByRole("heading", { name: deal.title }),
            ).toBeInTheDocument(),
        );
        response.resolve(
            jsonResponse({ detail: "No tienes permiso para mover esta oportunidad" }, 403),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "No tienes permiso para mover esta oportunidad",
        );
        expect(
            within(column("Prospección")).getByRole("heading", { name: deal.title }),
        ).toBeInTheDocument();
        expect(within(column("Ganado")).getByText("Sin oportunidades")).toBeInTheDocument();
        await waitFor(() =>
            expect(screen.getByRole("button", { name: `Mover ${deal.title}` })).toBeEnabled(),
        );
        await waitFor(() =>
            expect(screen.getByRole("button", { name: `Mover ${deal.title}` })).toHaveFocus(),
        );
        await keyboard.click(screen.getByRole("button", { name: "Cerrar aviso" }));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        await takeCard();
        expect(screen.getByRole("button", { name: `Mover ${deal.title}` })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
    });

    it.each(["[Escape]", "[Space]"])(
        "does not call the API when cancelling or dropping in the original column: %s",
        async (key) => {
            const fetchMock = vi.fn();
            vi.stubGlobal("fetch", fetchMock);
            renderBoard();
            const keyboard = await takeCard();
            await keyboard.keyboard(key);
            await waitFor(() =>
                expect(
                    screen.getByRole("button", { name: `Mover ${deal.title}` }),
                ).not.toHaveAttribute("aria-pressed", "true"),
            );
            expect(fetchMock).not.toHaveBeenCalled();
            expect(
                within(column("Prospección")).getByRole("heading", { name: deal.title }),
            ).toBeInTheDocument();
        },
    );

    it("moves with the pointer after the activation distance", async () => {
        const response = deferred<Response>();
        const serverDeal = { ...deal, stage_id: "stage-lost", status: "OPEN" };
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockImplementation((_url, options) =>
                    options.method === "POST"
                        ? response.promise
                        : Promise.resolve(jsonResponse([serverDeal])),
                ),
        );
        renderBoard();
        const handle = screen.getByRole("button", { name: `Mover ${deal.title}` });
        fireEvent.pointerDown(handle, {
            pointerId: 1,
            isPrimary: true,
            button: 0,
            clientX: 40,
            clientY: 100,
        });
        fireEvent.pointerMove(document, {
            pointerId: 1,
            isPrimary: true,
            clientX: 60,
            clientY: 100,
        });
        await waitFor(() => expect(handle).toHaveAttribute("aria-pressed", "true"));
        fireEvent.pointerMove(document, {
            pointerId: 1,
            isPrimary: true,
            clientX: 700,
            clientY: 100,
        });
        await waitFor(() =>
            expect(column("Perdido")).toHaveStyle({ outline: "2px solid #2563eb" }),
        );
        fireEvent.pointerUp(document, {
            pointerId: 1,
            isPrimary: true,
            clientX: 700,
            clientY: 100,
        });
        await waitFor(() =>
            expect(
                within(column("Perdido")).getByRole("heading", { name: deal.title }),
            ).toBeInTheDocument(),
        );
        response.resolve(jsonResponse(serverDeal));
        await screen.findByText("Movimiento guardado en Perdido.");
    });

    it("does not send a request when dropping outside every column", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        renderBoard();
        const handle = screen.getByRole("button", { name: `Mover ${deal.title}` });
        fireEvent.pointerDown(handle, {
            pointerId: 1,
            isPrimary: true,
            button: 0,
            clientX: 40,
            clientY: 100,
        });
        fireEvent.pointerMove(document, {
            pointerId: 1,
            isPrimary: true,
            clientX: 60,
            clientY: 100,
        });
        await waitFor(() => expect(handle).toHaveAttribute("aria-pressed", "true"));
        fireEvent.pointerMove(document, {
            pointerId: 1,
            isPrimary: true,
            clientX: 1200,
            clientY: 600,
        });
        fireEvent.pointerUp(document, {
            pointerId: 1,
            isPrimary: true,
            clientX: 1200,
            clientY: 600,
        });
        await waitFor(() => expect(handle).not.toHaveAttribute("aria-pressed", "true"));
        expect(fetchMock).not.toHaveBeenCalled();
        expect(
            within(column("Prospección")).getByRole("heading", { name: deal.title }),
        ).toBeInTheDocument();
    });

    it.each(["WON", "LOST"] as const)(
        "shows closed %s cards and prevents dragging them",
        async (status) => {
            client.setQueryData(queryKey, dealPages([{ ...deal, status }]));
            const fetchMock = vi.fn();
            vi.stubGlobal("fetch", fetchMock);
            renderBoard();
            const handle = screen.getByRole("button", { name: `Mover ${deal.title}` });
            expect(handle).toBeDisabled();
            expect(handle).toHaveAttribute(
                "title",
                "Esta oportunidad está cerrada y no se puede mover",
            );
            expect(
                within(column("Prospección")).getByText(`Estado: ${status}`),
            ).toBeInTheDocument();
            await userEvent.click(handle);
            expect(fetchMock).not.toHaveBeenCalled();
        },
    );

    it("keeps opportunities with a missing stage visible for consultation", () => {
        client.setQueryData(queryKey, dealPages([{ ...deal, stage_id: "removed-stage" }]));
        renderBoard();
        const fallback = screen.getByRole("region", { name: "Oportunidades sin etapa disponible" });
        expect(within(fallback).getByRole("heading", { name: deal.title })).toBeInTheDocument();
        expect(
            within(fallback).queryByRole("button", { name: `Mover ${deal.title}` }),
        ).not.toBeInTheDocument();
        expect(within(fallback).getByRole("alert")).toHaveTextContent(
            "1 oportunidad tiene una etapa",
        );
    });

    it("renders a pipeline without stages and preserves its cards", () => {
        render(
            <QueryClientProvider client={client}>
                <DealKanban pipeline={{ ...pipeline, stages: [] }} deals={[deal]} />
            </QueryClientProvider>,
        );
        expect(screen.getByText(/Este embudo no tiene etapas/)).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: deal.title })).toBeInTheDocument();
    });

    it("prevents moving in an inactive pipeline", () => {
        render(
            <QueryClientProvider client={client}>
                <DealKanban pipeline={{ ...pipeline, is_active: false }} deals={[deal]} />
            </QueryClientProvider>,
        );
        expect(screen.getByText(/Este embudo está inactivo/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: `Mover ${deal.title}` })).toHaveAttribute(
            "aria-disabled",
            "true",
        );
    });

    it("does not render cards from another pipeline", () => {
        render(
            <QueryClientProvider client={client}>
                <DealKanban
                    pipeline={pipeline}
                    deals={[{ ...deal, pipeline_id: "another-pipeline" }]}
                />
            </QueryClientProvider>,
        );
        expect(screen.queryByRole("heading", { name: deal.title })).not.toBeInTheDocument();
    });

    it("keeps rendering when a currency code is malformed", () => {
        client.setQueryData(queryKey, dealPages([{ ...deal, currency: "invalid" }]));
        renderBoard();
        expect(screen.getByText("15000.00 invalid")).toBeInTheDocument();
    });
});
