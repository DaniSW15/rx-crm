import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./http";
import { jsonResponse } from "../../test/fixtures";

afterEach(() => vi.unstubAllGlobals());

describe("HTTP error contract", () => {
    it("preserves the HTTP status and server message", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Sesión revocada" }, 401)));
        await expect(api("/auth/me")).rejects.toMatchObject({ name: "ApiError", status: 401, message: "Sesión revocada" });
    });

    it("extracts FastAPI validation messages without rendering raw objects", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: [{ loc: ["body", "new_stage_id"], msg: "UUID inválido" }] }, 422)));
        await expect(api("/deals/1/move-stage")).rejects.toMatchObject({ status: 422, message: "UUID inválido" });
    });

    it("handles a non-JSON HTTP error", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })));
        await expect(api("/deals")).rejects.toMatchObject({ status: 502, message: "Error HTTP 502" });
    });

    it("does not mistake network failure for an HTTP rejection", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
        try {
            await api("/deals");
            expect.fail("Expected a network failure");
        } catch (error) {
            expect(error).toBeInstanceOf(TypeError);
            expect(error).not.toBeInstanceOf(ApiError);
        }
    });

    it("accepts a successful empty response", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
        await expect(api("/auth/logout/", { method: "POST" })).resolves.toBeUndefined();
    });
});
