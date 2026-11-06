import { describe, expect, it, vi } from "vitest";
import { verifyApiAuth } from "../../scripts/verify-api-auth.mjs";

describe("API authentication deployment check", () => {
    it("accepts only explicit Bearer 401 responses on every private route", async () => {
        const request = vi.fn().mockImplementation(
            async () =>
                new Response(null, {
                    status: 401,
                    headers: { "WWW-Authenticate": "Bearer" },
                }),
        );
        const failures = await verifyApiAuth({
            baseUrl: "http://127.0.0.1:8000",
            request,
            log: vi.fn(),
        });
        expect(failures).toBe(0);
        expect(request).toHaveBeenCalledTimes(24);
        for (const [url, options] of request.mock.calls) {
            expect(url.origin).toBe("http://127.0.0.1:8000");
            expect(options.method).toBe("GET");
            expect(options.redirect).toBe("manual");
        }
    });

    it.each([200, 302, 403, 404, 500])(
        "reports HTTP %s instead of treating it as proof of authentication",
        async (status) => {
            const request = vi.fn().mockImplementation(async () => new Response(null, { status }));
            expect(
                await verifyApiAuth({ baseUrl: "http://127.0.0.1:8000", request, log: vi.fn() }),
            ).toBe(24);
        },
    );

    it("reports missing challenges and connection failures", async () => {
        const request = vi.fn().mockRejectedValue(new Error("offline"));
        request.mockResolvedValueOnce(new Response(null, { status: 401 }));
        expect(
            await verifyApiAuth({ baseUrl: "http://127.0.0.1:8000", request, log: vi.fn() }),
        ).toBe(24);
    });

    it("rejects credentials in the URL before making a request", async () => {
        const request = vi.fn();
        await expect(
            verifyApiAuth({ baseUrl: "https://user:password@example.test", request, log: vi.fn() }),
        ).rejects.toThrow("sin credenciales");
        expect(request).not.toHaveBeenCalled();
    });
});
