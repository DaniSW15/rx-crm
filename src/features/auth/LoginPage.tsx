import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useAuthStore } from "./auth.store";
import { useState, type ChangeEvent } from "react";
import { loginSession } from "./auth.api";

export default function LoginPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setSession = useAuthStore((state) => state.setSession);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: ChangeEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const session = await loginSession(email, password);
            queryClient.clear();
            setSession(session.token, session.user);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "No fue posible iniciar sesión. Por favor, inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main style={{ maxWidth: 400, margin: "80px auto" }}>
            <h1>CRM Platform</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Correo electrónico</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <br />
                <label htmlFor="password">Contraseña</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </form>
        </main>
    )
}