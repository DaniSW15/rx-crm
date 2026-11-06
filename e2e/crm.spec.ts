import { test, expect, type Page } from "@playwright/test";
import { customer, deal, pipeline, user } from "../src/test/fixtures.ts";

async function mockApi(page: Page, logoutStatus = 204) {
    const deals = Array.from({ length: 51 }, (_, index) => ({
        ...deal,
        id: `deal-${index}`,
        title: `Oportunidad ${index + 1}`,
    }));
    let rejectMove = false;
    const moves: unknown[] = [];
    const summary = {
        total_customers: 1,
        total_opportunities: 51,
        open_opportunities: 51,
        won_opportunities: 0,
        lost_opportunities: 0,
        amounts_by_currency: [
            {
                currency: "USD",
                open_amount: "765000.00",
                won_amount: "0",
                lost_amount: "0",
                total_amount: "765000.00",
            },
        ],
    };
    await page.route("**/api/v1/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname;
        if (path.endsWith("/auth/login"))
            return route.fulfill({ json: { access_token: "e2e-token" } });
        expect(request.headers().authorization).toBe("Bearer e2e-token");
        if (path.endsWith("/auth/me")) return route.fulfill({ json: user });
        if (path.endsWith("/auth/logout/")) {
            expect(request.method()).toBe("POST");
            return route.fulfill({
                status: logoutStatus,
                ...(logoutStatus === 204 ? {} : { json: { detail: "Temporal" } }),
            });
        }
        if (path.endsWith("/pipelines")) return route.fulfill({ json: [pipeline] });
        if (path.endsWith("/customers/")) return route.fulfill({ json: [customer] });
        if (path.endsWith("/analytics/summary/")) return route.fulfill({ json: summary });
        if (path.endsWith("/move-stage")) {
            const body = request.postDataJSON() as { new_stage_id: string };
            moves.push(body);
            if (rejectMove)
                return route.fulfill({ status: 409, json: { detail: "La oportunidad cambió" } });
            const target = deals.find((item) => path.includes(`/${item.id}/`));
            if (!target) throw new Error("Unexpected opportunity");
            target.stage_id = body.new_stage_id;
            return route.fulfill({ json: target });
        }
        if (path.endsWith("/deals")) {
            const offset = Number(url.searchParams.get("offset") ?? 0);
            const limit = Number(url.searchParams.get("limit") ?? 50);
            return route.fulfill({ json: deals.slice(offset, offset + limit) });
        }
        throw new Error(`Unexpected API request: ${path}`);
    });
    return {
        moves,
        rejectMoves: () => {
            rejectMove = true;
        },
    };
}

async function login(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill("e2e-password");
    await page.getByRole("button", { name: "Entrar a mi espacio" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
}

async function moveRight(page: Page, title: string, target: string) {
    const handle = page.getByRole("button", { name: `Mover ${title}`, exact: true });
    await handle.focus();
    await page.keyboard.press("Space");
    await expect(handle).toHaveAttribute("aria-pressed", "true");
    await expect(handle.locator("xpath=ancestor::section[@data-stage-id]")).toHaveAttribute(
        "data-drag-over",
        "true",
    );
    // dnd-kit attaches its keyboard listener after activation and column measurement.
    await page.evaluate(
        () =>
            new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            }),
    );
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("region", { name: target, exact: true })).toHaveAttribute(
        "data-drag-over",
        "true",
    );
    await page.keyboard.press("Space");
}

test("login, page 2, keyboard move, conflict rollback and remote logout", async ({ page }) => {
    const api = await mockApi(page);
    await login(page);
    await page.getByRole("link", { name: "Oportunidades", exact: true }).click();
    await expect(page.getByText("50 oportunidades cargadas", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cargar más oportunidades" }).click();
    await expect(page.getByText("51 oportunidades cargadas", { exact: true })).toBeVisible();
    await moveRight(page, "Oportunidad 51", "Ganado");
    await expect(page.getByText("Movimiento guardado en Ganado.")).toBeVisible();
    expect(api.moves).toEqual([{ new_stage_id: "stage-won" }]);
    api.rejectMoves();
    await moveRight(page, "Oportunidad 51", "Perdido");
    await expect(page.getByRole("alert")).toContainText("La oportunidad cambió");
    await expect(
        page
            .getByRole("region", { name: "Ganado", exact: true })
            .getByRole("heading", { name: "Oportunidad 51", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cerrar sesión", exact: true }).first().click();
    await expect(page.getByRole("status")).toHaveText("Sesión cerrada.");
    await expect(page).toHaveURL(/\/login$/);
});

test("mobile navigation and honest feedback when remote revocation fails", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page, 503);
    await login(page);
    await page.getByRole("button", { name: "Abrir navegación" }).click();
    await page.getByRole("link", { name: "Clientes", exact: true }).click();
    await expect(page.getByText(customer.name, { exact: true })).toBeVisible();
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole("button", { name: "Abrir navegación" }).click();
    await page.getByRole("button", { name: "Cerrar sesión", exact: true }).first().click();
    await expect(page.getByRole("alert")).toContainText("No pudimos confirmar la revocación");
    await expect(page).toHaveURL(/\/login$/);
});
