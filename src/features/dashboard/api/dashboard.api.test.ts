import { describe, expect, it, vi } from "vitest";
import { jsonResponse } from "../../../test/fixtures";
import { getCrmSummary } from "./dashboard.api";

describe("analytics HTTP contract", () => {
    it("validates amounts separately by currency and forwards authentication and cancellation", async () => {
        const summary = {
            total_customers: 1,
            total_opportunities: 2,
            open_opportunities: 2,
            won_opportunities: 0,
            lost_opportunities: 0,
            amounts_by_currency: [
                {
                    currency: "USD",
                    open_amount: "15.00",
                    won_amount: "0",
                    lost_amount: "0",
                    total_amount: "15.00",
                },
                {
                    currency: "MXN",
                    open_amount: "20.00",
                    won_amount: "0",
                    lost_amount: "0",
                    total_amount: "20.00",
                },
            ],
        };
        const request = vi.fn().mockResolvedValue(jsonResponse(summary));
        vi.stubGlobal("fetch", request);
        const controller = new AbortController();
        await expect(getCrmSummary("token", controller.signal)).resolves.toEqual(summary);
        expect(request.mock.calls[0][0]).toBe("/api/v1/analytics/summary/");
        expect(request.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer token");
        expect(request.mock.calls[0][1].signal).toBe(controller.signal);
    });

    it("rejects a malformed summary without exposing its contents", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ total_opportunities: "private-raw-value" })),
        );
        await expect(getCrmSummary("token")).rejects.toThrow("formato inesperado");
    });
});
