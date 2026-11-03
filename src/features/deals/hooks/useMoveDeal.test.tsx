import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../auth/auth.store";
import { deal, deferred, jsonResponse, pipeline, user } from "../../../test/fixtures";
import { dealKeys } from "../api/dealKeys";
import type { Deal } from "../types/deal.tpes";
import { useDeals } from "./useDeals";
import { useMoveDeal } from "./useMoveDeal";

const queryKey = dealKeys.list(user.tenant_id, pipeline.id);
let client: QueryClient;

function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
    useAuthStore.getState().setSession("test-token", user);
    client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    client.setQueryData(queryKey, [deal]);
});

afterEach(() => {
    client.clear();
    useAuthStore.getState().logout();
});

describe("useMoveDeal", () => {
    it.each([
        ["stage-won", "WON"],
        ["stage-lost", "LOST"],
        ["stage-open", "OPEN"],
    ])("optimistically moves to %s with status %s and reconciles the server response", async (stageId, status) => {
        const original = stageId === "stage-open"
            ? { ...deal, stage_id: "stage-lost", status: "LOST" as const }
            : deal;
        client.setQueryData(queryKey, [original]);
        const response = deferred<Response>();
        const fetchMock = vi.fn().mockReturnValue(response.promise);
        vi.stubGlobal("fetch", fetchMock);
        const { result } = renderHook(() => useMoveDeal(pipeline), { wrapper: Wrapper });

        act(() => result.current.mutate({ dealId: deal.id, stageId }));

        await waitFor(() => expect(client.getQueryData<Deal[]>(queryKey)?.[0]).toMatchObject({ stage_id: stageId, status }));
        expect(result.current.isMoving).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe(`/api/v1/deals/${deal.id}/move-stage`);
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body)).toEqual({ new_stage_id: stageId });
        expect(options.headers.get("Authorization")).toBe("Bearer test-token");
        expect(options.headers.get("Content-Type")).toBe("application/json");

        const serverDeal = { ...original, stage_id: stageId, status, title: "Título del servidor", actual_close_date: "2026-11-02T12:00:00Z" };
        response.resolve(jsonResponse(serverDeal));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(client.getQueryData(queryKey)).toEqual([serverDeal]);
        expect(client.getQueryState(queryKey)?.isInvalidated).toBe(true);
    });

    it.each([403, 422, 500])("rolls back a rejected HTTP %s move without overwriting other cards or tenants", async (status) => {
        const other = { ...deal, id: "deal-2", title: "Otra oportunidad" };
        const otherTenantKey = dealKeys.list("tenant-2", pipeline.id);
        client.setQueryData(queryKey, [deal, other]);
        client.setQueryData(otherTenantKey, [other]);
        const response = deferred<Response>();
        const fetchMock = vi.fn().mockReturnValue(response.promise);
        vi.stubGlobal("fetch", fetchMock);
        const { result } = renderHook(() => useMoveDeal(pipeline), { wrapper: Wrapper });

        act(() => result.current.mutate({ dealId: deal.id, stageId: "stage-won" }));
        await waitFor(() => expect(client.getQueryData<Deal[]>(queryKey)?.[0].stage_id).toBe("stage-won"));
        const changedOther = { ...other, title: "Actualizada durante el movimiento" };
        act(() => client.setQueryData<Deal[]>(queryKey, (items) => items?.map((item) => item.id === other.id ? changedOther : item)));
        response.resolve(jsonResponse({ detail: "No puedes mover esta oportunidad" }, status));

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe("No puedes mover esta oportunidad");
        expect(client.getQueryData(queryKey)).toEqual([deal, changedOther]);
        expect(client.getQueryData(otherTenantKey)).toEqual([other]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("rolls back when the network fails", async () => {
        const response = deferred<Response>();
        vi.stubGlobal("fetch", vi.fn().mockReturnValue(response.promise));
        const { result } = renderHook(() => useMoveDeal(pipeline), { wrapper: Wrapper });
        act(() => result.current.mutate({ dealId: deal.id, stageId: "stage-won" }));
        await waitFor(() => expect(client.getQueryData<Deal[]>(queryKey)?.[0].stage_id).toBe("stage-won"));
        response.reject(new TypeError("Failed to fetch"));
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(client.getQueryData(queryKey)).toEqual([deal]);
    });

    it("rejects a stage outside the pipeline without sending a request", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const { result } = renderHook(() => useMoveDeal(pipeline), { wrapper: Wrapper });
        act(() => result.current.mutate({ dealId: deal.id, stageId: "foreign-stage" }));
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(fetchMock).not.toHaveBeenCalled();
        expect(client.getQueryData(queryKey)).toEqual([deal]);
    });

    it("cancels an in-flight list request so it cannot overwrite the optimistic move", async () => {
        const staleList = deferred<Response>();
        const moveResponse = deferred<Response>();
        const fetchMock = vi.fn().mockReturnValueOnce(staleList.promise).mockReturnValueOnce(moveResponse.promise);
        vi.stubGlobal("fetch", fetchMock);
        client.setQueryDefaults(queryKey, { staleTime: 0 });
        const { result } = renderHook(() => ({ list: useDeals(pipeline.id), move: useMoveDeal(pipeline) }), { wrapper: Wrapper });
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;

        act(() => result.current.move.mutate({ dealId: deal.id, stageId: "stage-won" }));
        await waitFor(() => expect(result.current.list.data?.[0].stage_id).toBe("stage-won"));
        expect(signal.aborted).toBe(true);
        await act(async () => { staleList.resolve(jsonResponse([deal])); });
        expect(client.getQueryData<Deal[]>(queryKey)?.[0].stage_id).toBe("stage-won");
        fetchMock.mockResolvedValue(jsonResponse([{ ...deal, stage_id: "stage-won", status: "WON" }]));
        moveResponse.resolve(jsonResponse({ ...deal, stage_id: "stage-won", status: "WON" }));
        await waitFor(() => expect(result.current.move.isSuccess).toBe(true));
    });

    it("does not recreate private data when logout happens during a move", async () => {
        const response = deferred<Response>();
        const fetchMock = vi.fn().mockReturnValue(response.promise);
        vi.stubGlobal("fetch", fetchMock);
        const { result } = renderHook(() => useMoveDeal(pipeline), { wrapper: Wrapper });
        let movement!: Promise<Deal>;
        act(() => { movement = result.current.mutateAsync({ dealId: deal.id, stageId: "stage-won" }); });
        await waitFor(() => expect(client.getQueryData<Deal[]>(queryKey)?.[0].stage_id).toBe("stage-won"));
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        act(() => { client.clear(); useAuthStore.getState().logout(); });
        await act(async () => {
            response.resolve(jsonResponse({ ...deal, stage_id: "stage-won", status: "WON" }));
            await movement;
        });
        expect(client.getQueryData(queryKey)).toBeUndefined();
        expect(client.getQueryCache().getAll()).toHaveLength(0);
    });

    it("does not apply the old session's response to a new tenant", async () => {
        const response = deferred<Response>();
        const fetchMock = vi.fn().mockReturnValue(response.promise);
        vi.stubGlobal("fetch", fetchMock);
        const { result } = renderHook(() => useMoveDeal(pipeline), { wrapper: Wrapper });
        let movement!: Promise<Deal>;
        act(() => { movement = result.current.mutateAsync({ dealId: deal.id, stageId: "stage-won" }); });
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        const otherUser = { ...user, tenant_id: "tenant-2" };
        const otherKey = dealKeys.list(otherUser.tenant_id, pipeline.id);
        const otherDeal = { ...deal, tenant_id: "tenant-2", title: "Otra organización" };
        act(() => {
            useAuthStore.getState().setSession("other-token", otherUser);
            client.setQueryData(otherKey, [otherDeal]);
        });
        await act(async () => {
            response.resolve(jsonResponse({ ...deal, stage_id: "stage-won", status: "WON" }));
            await movement;
        });
        expect(client.getQueryData(otherKey)).toEqual([otherDeal]);
    });
});
