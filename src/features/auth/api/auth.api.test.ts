import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, user } from "../../../test/fixtures";
import { loginSession } from "./auth.api";

afterEach(() => vi.unstubAllGlobals());

describe("authentication contracts", () => {
    it("loads a validated boolean profile with the issued token", async () => {
        const request = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ access_token: "issued-token" }))
            .mockResolvedValueOnce(jsonResponse(user));
        vi.stubGlobal("fetch", request);
        await expect(loginSession(user.email, "password")).resolves.toEqual({
            token: "issued-token",
            user,
        });
        expect(request.mock.calls[0][1].body).toBe(
            JSON.stringify({ email: user.email, password: "password" }),
        );
        expect(request.mock.calls[1][1].headers.get("Authorization")).toBe("Bearer issued-token");
    });

    it.each(["false", "true", null])(
        "rejects a profile with an invalid is_active value: %s",
        async (is_active) => {
            vi.stubGlobal(
                "fetch",
                vi
                    .fn()
                    .mockResolvedValueOnce(jsonResponse({ access_token: "private-token" }))
                    .mockResolvedValueOnce(jsonResponse({ ...user, is_active })),
            );
            await expect(loginSession(user.email, "password")).rejects.toThrow(
                "formato inesperado",
            );
        },
    );

    it("rejects an inactive account", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ access_token: "token" }))
                .mockResolvedValueOnce(jsonResponse({ ...user, is_active: false })),
        );
        await expect(loginSession(user.email, "password")).rejects.toThrow("inactiva");
    });

    it("does not request a profile if the access token is missing", async () => {
        const request = vi.fn().mockResolvedValue(jsonResponse({ message: "not a session" }));
        vi.stubGlobal("fetch", request);
        await expect(loginSession(user.email, "password")).rejects.toThrow("formato inesperado");
        expect(request).toHaveBeenCalledTimes(1);
    });
});
