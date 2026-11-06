import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "../../auth";
import { user } from "../../../test/fixtures";
import DashboardPage from "./DashboardPage";
import type { CrmSummary } from "../model/summary";

let client: QueryClient;
const summary: CrmSummary = {
    total_customers: 7,
    total_opportunities: 10,
    open_opportunities: 6,
    won_opportunities: 3,
    lost_opportunities: 1,
    amounts_by_currency: [
        {
            currency: "USD",
            open_amount: "15000",
            won_amount: "8000",
            lost_amount: "2000",
            total_amount: "25000",
        },
        {
            currency: "MXN",
            open_amount: "99000",
            won_amount: "12000",
            lost_amount: "4000",
            total_amount: "115000",
        },
    ],
};

function renderDashboard(data = summary, detailed = false) {
    client.setQueryData(["crm-summary", user.tenant_id], data);
    client.setQueryData(["recent-deals", user.tenant_id], []);
    client.setQueryData(["customers", user.tenant_id, 0, 4], []);
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter>
                <DashboardPage detailed={detailed} />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    useAuthStore.getState().setSession("test-token", user);
    client = new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
});
afterEach(() => {
    client.clear();
    useAuthStore.getState().logout();
});

describe("Dashboard financial presentation", () => {
    it("changes currency without adding amounts from different currencies", async () => {
        renderDashboard();
        expect(screen.getByText("$25,000")).toBeInTheDocument();
        await userEvent.selectOptions(
            screen.getByRole("combobox", { name: "Moneda de los indicadores" }),
            "MXN",
        );
        expect(screen.getByText("$115,000")).toBeInTheDocument();
        expect(screen.queryByText("$25,000")).not.toBeInTheDocument();
        expect(screen.queryByText("$140,000")).not.toBeInTheDocument();
    });

    it("explains empty data without inventing revenue or historical trends", () => {
        renderDashboard({
            total_customers: 0,
            total_opportunities: 0,
            open_opportunities: 0,
            won_opportunities: 0,
            lost_opportunities: 0,
            amounts_by_currency: [],
        });
        expect(
            screen.getByText("Los importes aparecerán al registrar oportunidades."),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("img", { name: /0% de oportunidades ganadas; 0 oportunidades/ }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
    });

    it("presents each currency separately in the analytics table", () => {
        renderDashboard(summary, true);
        expect(screen.getByRole("heading", { name: "Valor por moneda" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "USD" })).toBeInTheDocument();
        expect(screen.getByRole("cell", { name: "MXN" })).toBeInTheDocument();
    });
});
