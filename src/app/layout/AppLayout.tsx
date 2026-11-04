import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../features/auth/auth.store";
import Icon from "../../shared/ui/Icon";
import type { IconName } from "../../shared/ui/Icon";
import { useTheme } from "../../shared/theme/theme";

const navigation: { to: string; label: string; icon: IconName }[] = [
    { to: "/dashboard", label: "Vista general", icon: "dashboard" },
    { to: "/deals", label: "Oportunidades", icon: "deals" },
    { to: "/customers", label: "Clientes", icon: "customers" },
    { to: "/analytics", label: "Analítica", icon: "analytics" },
];

export default function AppLayout() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const helpRef = useRef<HTMLDialogElement>(null);
    const profileRef = useRef<HTMLDetailsElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const isMoving = useIsMutating({ mutationKey: ["move-deal", user?.tenant_id] }) > 0;
    const name = user?.full_name?.trim() || "tu equipo";
    const firstName = name.split(/\s+/)[0];
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const activePage = navigation.find((item) => item.to === location.pathname)?.label ?? "Tu CRM";

    useEffect(() => {
        if (menuOpen) sidebarRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    }, [menuOpen]);

    useEffect(() => {
        function closeProfile(event: PointerEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) profileRef.current.open = false;
        }
        document.addEventListener("pointerdown", closeProfile);
        return () => document.removeEventListener("pointerdown", closeProfile);
    }, []);

    function closeMenu() { setMenuOpen(false); menuButtonRef.current?.focus(); }

    function handleLogout() {
        queryClient.clear();
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <div className="app-shell">
            <a className="skip-link" href="#main-content">Ir al contenido</a>
            {menuOpen && <button className="sidebar-backdrop" aria-label="Cerrar navegación" onClick={closeMenu} />}
            <aside ref={sidebarRef} className={`app-sidebar${menuOpen ? " is-open" : ""}`} aria-label="Navegación principal"
                onKeyDown={(event) => { if (event.key === "Escape") closeMenu(); }}>
                <Link className="brand" to="/dashboard" onClick={() => setMenuOpen(false)}>
                    <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
                    <span>RX<span className="brand-light"> / </span>CRM<small>Tu negocio, conectado.</small></span>
                </Link>
                <p className="sidebar-label">WORKSPACE</p>
                <nav className="sidebar-nav">
                    {navigation.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => `sidebar-link${isActive ? " is-active" : ""}`}>
                        <Icon name={item.icon} /><span>{item.label}</span><span className="nav-active-dot" />
                    </NavLink>)}
                </nav>
                <div className="sidebar-bottom">
                    <div className="workspace-card"><span className="workspace-icon"><Icon name="customers" /></span>
                        <div><strong>Mi organización</strong><small>Espacio de trabajo · {user?.role ?? "Equipo"}</small></div>
                    </div>
                    <button className="sidebar-link" onClick={() => helpRef.current?.showModal()}><Icon name="help" /><span>Guía rápida</span></button>
                    <button className="sidebar-link" onClick={handleLogout}><Icon name="logout" /><span>Cerrar sesión</span></button>
                    <div className="theme-switch" role="group" aria-label="Apariencia">
                        <button aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Icon name="sun" size={17} />Claro</button>
                        <button aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Icon name="moon" size={17} />Oscuro</button>
                    </div>
                    <small className="sidebar-footnote">Un espacio para crecer.</small>
                </div>
            </aside>
            <div className="app-body">
                <header className="app-topbar">
                    <button ref={menuButtonRef} className="icon-button mobile-menu" aria-label="Abrir navegación" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button>
                    <span className="greeting-avatar" aria-hidden="true">{initials}</span>
                    <div className="greeting"><p className="eyebrow">{activePage}</p><h1>Hola, {firstName}<span className="greeting-dot">.</span></h1><p>Una vista clara de tu negocio.</p></div>
                    <div className="topbar-actions">
                        <button className="icon-button" aria-label="Actualizar datos" title="Actualizar datos" disabled={isMoving}
                            onClick={() => void queryClient.invalidateQueries({ predicate: (query) => Boolean(user?.tenant_id && query.queryKey.includes(user.tenant_id)) })}><Icon name="refresh" /></button>
                        <Link className="icon-button search-shortcut" to="/customers" aria-label="Buscar clientes" title="Buscar clientes"><Icon name="search" /></Link>
                        <details className="profile-menu" ref={profileRef} onKeyDown={(event) => { if (event.key === "Escape" && profileRef.current) { profileRef.current.open = false; profileRef.current.querySelector("summary")?.focus(); } }}>
                            <summary><span className="mini-avatar">{initials}</span><span>{firstName}</span><Icon name="chevron" size={17} /></summary>
                            <div className="profile-menu__panel"><strong>{name}</strong><span>{user?.email}</span><small>Rol: {user?.role}</small>
                                <button className="ui-button" onClick={handleLogout}><Icon name="logout" size={17} />Cerrar sesión</button>
                            </div>
                        </details>
                    </div>
                </header>
                <div className="app-content" id="main-content" tabIndex={-1}><Outlet /></div>
                <footer className="app-footer"><span>RX CRM <span className="footer-dot">•</span> Hecho para tu siguiente paso.</span><span>Tu espacio de trabajo</span></footer>
            </div>
            <dialog className="help-dialog" ref={helpRef}>
                <div className="panel-heading"><h2>Tu CRM, a tu ritmo</h2><button className="icon-button" aria-label="Cerrar guía" onClick={() => helpRef.current?.close()}><Icon name="close" /></button></div>
                <p>Todo lo esencial para seguir tus relaciones comerciales.</p>
                <ol><li><strong>Vista general.</strong> Consulta el valor y el estado actual de tus oportunidades.</li><li><strong>Oportunidades.</strong> Arrastra desde Mover para cambiar de etapa. También puedes usar Espacio y las flechas.</li><li><strong>Clientes.</strong> Encuentra los datos de contacto de tu organización.</li></ol>
                <button className="ui-button ui-button--primary" onClick={() => helpRef.current?.close()}>Entendido<Icon name="check" size={18} /></button>
            </dialog>
        </div>
    );
}
