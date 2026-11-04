import { Routes, Route, Navigate, Outlet } from "react-router";
import LoginPage from "../../features/auth/pages/LoginPage";
import DealsPage from "../../features/deals/pages/DealsPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import CustomersPage from "../../features/customers/pages/CustomersPage";
import { useAuthStore } from "../../features/auth/auth.store";
import AppLayout from "../layout/AppLayout";

function ProtectedRoute() {
    const token = useAuthStore((state) => state.token);
    return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function AppRouter() {
    return <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/deals" element={<DealsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/analytics" element={<DashboardPage detailed />} />
            </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>;
}
