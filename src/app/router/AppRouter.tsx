import {
    Routes,
    Route,
    Navigate,
    Outlet,
    Link,
    useNavigate,
} from "react-router";

import { useQueryClient } from "@tanstack/react-query";

import LoginPage from "../../features/auth/pages/LoginPage";
import DealsPage from "../../features/deals/pages/DealsPage";
import { useAuthStore } from "../../features/auth/auth.store";

function ProtectedRoute() {
    const token = useAuthStore((s) => s.token);

    return token
        ? <Outlet />
        : <Navigate to="/login" replace />;
}

function DashboardPage() {
    const user = useAuthStore((s) => s.user);

    return (
        <main>
            <h1>Dashboard CRM</h1>
            <p>Bienvenido, {user?.full_name}</p>
            <p>Tu rol: {user?.role}</p>
            <p>Organización: {user?.tenant_id}</p>
        </main>
    );
}

function AppLayout() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    function handleLogout() {
        queryClient.clear();
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <>
            <header>
                <strong>CRM Platform</strong>

                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    {" | "}
                    <Link to="/deals">Oportunidades</Link>
                </nav>

                <p>{user?.email}</p>

                <button onClick={handleLogout}>
                    Cerrar sesión
                </button>
            </header>

            <hr />
            <Outlet />
        </>
    );
}

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                    />

                    <Route
                        path="/dashboard"
                        element={<DashboardPage />}
                    />

                    <Route
                        path="/deals"
                        element={<DealsPage />}
                    />
                </Route>
            </Route>

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}
