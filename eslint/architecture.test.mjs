import path from "node:path";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
import { moduleBoundaries } from "./architecture.mjs";

function check(file, code) {
    return new Linter().verify(
        code,
        [
            {
                files: ["**/*.js"],
                plugins: { architecture: { rules: { boundaries: moduleBoundaries } } },
                rules: { "architecture/boundaries": "error" },
            },
        ],
        { filename: path.resolve(file) },
    );
}

describe("module boundaries", () => {
    it("rejects a shared component importing a feature", () => {
        expect(
            check(
                "src/shared/ui/example.js",
                'import { useAuthStore } from "../../features/auth";',
            )[0].messageId,
        ).toBe("shared");
    });
    it("rejects deep cross-feature imports", () => {
        expect(
            check(
                "src/features/customers/pages/example.js",
                'import { isAccessError } from "../../dashboard/api/dashboard.api";',
            )[0].messageId,
        ).toBe("public");
    });
    it("rejects React Query inside an API adapter", () => {
        expect(
            check(
                "src/features/deals/api/example.js",
                'import { useQuery } from "@tanstack/react-query";',
            )[0].messageId,
        ).toBe("layer");
    });
    it("accepts feature interfaces and shared utilities", () => {
        expect(
            check(
                "src/features/dashboard/pages/example.js",
                'import { useCustomers } from "../../customers"; import { formatMoney } from "../../../shared/lib/formatMoney";',
            ),
        ).toEqual([]);
    });
});
