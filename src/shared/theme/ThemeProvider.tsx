import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { ThemeContext } from "./theme";
import type { Theme } from "./theme";

export default function ThemeProvider({ children }: PropsWithChildren) {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            return localStorage.getItem("rx-crm-theme") === "light" ? "light" : "dark";
        } catch {
            return "dark";
        }
    });
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem("rx-crm-theme", theme);
        } catch {
            /* Theme remains usable without storage. */
        }
    }, [theme]);
    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
