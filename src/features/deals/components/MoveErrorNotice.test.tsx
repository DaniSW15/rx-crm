import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../shared/api/http";
import MoveErrorNotice from "./MoveErrorNotice";

describe("MoveErrorNotice", () => {
    it("offers login when the session is rejected", () => {
        render(<MoveErrorNotice error={new ApiError(401, "Token inválido")} onDismiss={vi.fn()} />);
        expect(screen.getByRole("alert")).toHaveTextContent("Tu sesión no es válida");
        expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
    });

    it("explains a version conflict without offering to blindly repeat the write", () => {
        render(<MoveErrorNotice error={new ApiError(409, "Versión obsoleta")} onDismiss={vi.fn()} />);
        expect(screen.getByRole("alert")).toHaveTextContent("La oportunidad cambió");
        expect(screen.queryByRole("button", { name: /reintentar/i })).not.toBeInTheDocument();
    });

    it("treats a network failure as an unconfirmed outcome", async () => {
        const onDismiss = vi.fn();
        render(<MoveErrorNotice error={new TypeError("Failed to fetch")} onDismiss={onDismiss} />);
        expect(screen.getByRole("alert")).toHaveTextContent("Actualiza el tablero antes de volver a intentarlo");
        await userEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
        expect(onDismiss).toHaveBeenCalledOnce();
    });
});
