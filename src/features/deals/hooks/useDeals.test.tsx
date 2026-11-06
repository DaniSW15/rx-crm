import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../auth";
import { deal, deferred, jsonResponse, pipeline, user } from "../../../test/fixtures";
import { useDeals } from "./useDeals";
import { useMoveDeal } from "./useMoveDeal";

let client: QueryClient;
const page = Array.from({ length: 50 }, (_, id) => ({ ...deal, id: `deal-${id}` }));
function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
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

describe("paginated opportunities", () => {
    it("loads opportunity 51, uses server offsets and stops after a short page", async () => {
        const last = { ...deal, id: "deal-50" };
        const request = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(page))
            .mockResolvedValueOnce(jsonResponse([last]));
        vi.stubGlobal("fetch", request);
        const { result } = renderHook(() => useDeals(pipeline.id), { wrapper: Wrapper });
        await waitFor(() => expect(result.current.data).toHaveLength(50));
        expect(result.current.hasNextPage).toBe(true);
        await act(async () => {
            await result.current.fetchNextPage();
        });
        await waitFor(() => expect(result.current.data).toHaveLength(51));
        expect(result.current.data?.[50]).toEqual(last);
        expect(result.current.hasNextPage).toBe(false);
        expect(request.mock.calls[0][0]).toContain("offset=0");
        expect(request.mock.calls[1][0]).toContain("offset=50");
        expect(request.mock.calls[1][1].headers.get("Authorization")).toBe("Bearer token");
    });

    it("keeps existing cards if the next page fails and retries the same offset", async () => {
        const request = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(page))
            .mockResolvedValueOnce(jsonResponse({ detail: "Temporal" }, 503))
            .mockResolvedValueOnce(jsonResponse([]));
        vi.stubGlobal("fetch", request);
        const { result } = renderHook(() => useDeals(pipeline.id), { wrapper: Wrapper });
        await waitFor(() => expect(result.current.data).toHaveLength(50));
        expect(result.current.isFetchNextPageError).toBe(false);
        await act(async () => {
            await result.current.fetchNextPage();
        });
        await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true));
        expect(result.current.data).toHaveLength(50);
        await act(async () => {
            await result.current.fetchNextPage();
        });
        await waitFor(() => expect(result.current.hasNextPage).toBe(false));
        expect(request.mock.calls[2][0]).toContain("offset=50");
    });

    it("deduplicates cards repeated across offset pages", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse(page))
                .mockResolvedValueOnce(jsonResponse([page[49]])),
        );
        const { result } = renderHook(() => useDeals(pipeline.id), { wrapper: Wrapper });
        await waitFor(() => expect(result.current.data).toHaveLength(50));
        expect(result.current.hasNextPage).toBe(true);
        await act(async () => {
            await result.current.fetchNextPage();
        });
        expect(result.current.data).toHaveLength(50);
        await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    });

    it("moves and rolls back an opportunity from the second page without losing the first", async () => {
        const last = { ...deal, id: "deal-50", title: "Página dos" };
        const movement = deferred<Response>();
        const request = vi.fn().mockImplementation((url: string, options: RequestInit) => {
            if (options.method === "POST") return movement.promise;
            return Promise.resolve(jsonResponse(url.includes("offset=50") ? [last] : page));
        });
        vi.stubGlobal("fetch", request);
        const { result } = renderHook(
            () => ({ list: useDeals(pipeline.id), move: useMoveDeal(pipeline) }),
            { wrapper: Wrapper },
        );
        await waitFor(() => expect(result.current.list.data).toHaveLength(50));
        await act(async () => {
            await result.current.list.fetchNextPage();
        });
        act(() => result.current.move.mutate({ dealId: last.id, stageId: "stage-won" }));
        await waitFor(() => expect(result.current.list.data?.[50].stage_id).toBe("stage-won"));
        expect(result.current.list.data?.slice(0, 50)).toEqual(page);
        movement.resolve(jsonResponse({ detail: "Conflicto" }, 409));
        await waitFor(() => expect(result.current.move.isError).toBe(true));
        expect(result.current.list.data).toEqual([...page, last]);
    });
});
