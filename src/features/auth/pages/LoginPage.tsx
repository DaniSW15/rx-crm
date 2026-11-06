import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../auth.store";
import { useState, type SubmitEvent } from "react";
import { loginSession } from "../api/auth.api";
import Icon from "../../../shared/ui/Icon";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const logoutStatus: unknown = location.state?.logoutStatus;
    const queryClient = useQueryClient();
    const setSession = useAuthStore((state) => state.setSession);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");
        try {
            const session = await loginSession(email, password);
            queryClient.clear();
            setSession(session.token, session.user);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible iniciar sesión. Inténtalo de nuevo.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-layout">
            <section className="login-story" aria-label="Bienvenido a RX CRM">
                <div className="brand">
                    <span className="brand-mark" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                    </span>
                    <span>
                        RX<span className="brand-light"> / </span>CRM
                        <small>Tu negocio, conectado.</small>
                    </span>
                </div>
                <h2>
                    Tus relaciones.
                    <br />
                    Tu próximo gran paso.
                </h2>
                <p>
                    Dale claridad a tu proceso comercial. Tus clientes, tus oportunidades y tu
                    equipo, en un mismo espacio.
                </p>
                <div className="login-preview" aria-hidden="true">
                    <div className="login-preview__header">
                        <span>Una perspectiva más clara</span>
                        <Icon name="analytics" size={19} />
                    </div>
                    <div className="login-preview__bars">
                        <span style={{ height: "42%" }} />
                        <span style={{ height: "70%" }} />
                        <span style={{ height: "55%" }} />
                        <span style={{ height: "100%" }} />
                        <span style={{ height: "78%" }} />
                    </div>
                    <div className="login-preview__line" />
                    <div className="login-preview__line" style={{ width: "43%", marginTop: 9 }} />
                </div>
                <span className="login-story__note">
                    Un espacio para conectar. Una forma de avanzar.
                </span>
            </section>
            <section className="login-form-panel">
                <div className="login-form">
                    <span className="eyebrow">BIENVENIDO A TU WORKSPACE</span>
                    <h1>Qué gusto verte de nuevo.</h1>
                    <p>Inicia sesión y continúa donde lo dejaste.</p>
                    {logoutStatus === "pending" && (
                        <p role="status">
                            Acceso local cerrado. Confirmando el cierre en el servidor…
                        </p>
                    )}
                    {logoutStatus === "closed" && <p role="status">Sesión cerrada.</p>}
                    {logoutStatus === "unconfirmed" && (
                        <p role="alert">
                            El acceso local se cerró. No pudimos confirmar la revocación en el
                            servidor; el token anterior podría seguir vigente hasta que expire.
                        </p>
                    )}
                    <form onSubmit={handleSubmit} aria-busy={loading}>
                        <label htmlFor="email">Correo electrónico</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="username"
                            placeholder="tu@empresa.com"
                            required
                            disabled={loading}
                        />
                        <label htmlFor="password">Contraseña</label>
                        <div className="password-field">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                placeholder="Tu contraseña"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                aria-label={
                                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                                }
                                aria-pressed={showPassword}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <Icon name="eye" size={19} />
                            </button>
                        </div>
                        {error && (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        )}
                        <button
                            className="ui-button ui-button--primary login-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Entrando a tu espacio…" : "Entrar a mi espacio"}
                            <Icon name="arrow" size={19} />
                        </button>
                    </form>
                    <p className="login-help">
                        ¿Necesitas ayuda para entrar?
                        <br />
                        Contacta al administrador de tu organización.
                    </p>
                </div>
            </section>
        </main>
    );
}
