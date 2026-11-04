import { useState } from "react";
import Icon from "../../../shared/ui/Icon";
import FetchNotice from "../../../shared/ui/FetchNotice";
import { useCustomers } from "../api/customers.api";
import { isAccessError } from "../../dashboard/api/dashboard.api";

export default function CustomersPage() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const customersQuery = useCustomers(page);
    const customers = isAccessError(customersQuery.error) ? [] : customersQuery.data ?? [];
    const filtered = customers.filter((customer) => `${customer.name} ${customer.industry ?? ""} ${customer.phone ?? ""}`.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")));
    return <main className="customers-page">
        <div className="page-section-heading"><div><p className="eyebrow">CONOCE A TU COMUNIDAD</p><h2>Relaciones que hacen crecer tu negocio.</h2></div><button className="ui-button" onClick={() => void customersQuery.refetch()} disabled={customersQuery.isFetching}><Icon name="refresh" size={17} />Actualizar</button></div>
        <section className="surface directory-panel"><div className="panel-heading"><div><h2>Directorio de clientes</h2><p>La información de contacto de tu organización.</p></div><span className="soft-badge">{customers.length} en esta página</span></div>
            <label className="search-field"><Icon name="search" size={18} /><input aria-label="Buscar clientes en esta página" placeholder="Buscar nombre, sector o teléfono…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            {customersQuery.isError && <FetchNotice error={customersQuery.error} retry={() => void customersQuery.refetch()} busy={customersQuery.isFetching} />}
            <div className="table-scroll"><table className="crm-table"><thead><tr><th>Cliente</th><th>Sector</th><th>Teléfono</th><th>Sitio web</th></tr></thead><tbody>{filtered.map((customer, index) => <tr key={customer.id}><td><span className="table-title"><span className={`customer-avatar avatar-tone-${index % 3}`}>{customer.name.slice(0, 2).toUpperCase()}</span><strong>{customer.name}</strong></span></td><td>{customer.industry || "Sin especificar"}</td><td>{customer.phone || "Sin teléfono"}</td><td>{customer.website || "Sin sitio web"}</td></tr>)}</tbody></table></div>
            {customersQuery.isPending && <p className="empty-panel" role="status">Cargando clientes…</p>}
            {!customersQuery.isPending && !customersQuery.isError && filtered.length === 0 && <p className="empty-panel">{search ? "No hay coincidencias en esta página." : "Todavía no hay clientes en esta página."}</p>}
            <div className="table-pagination"><span>Página {page + 1}</span><div><button className="ui-button" disabled={page === 0 || customersQuery.isFetching} onClick={() => { setPage(page - 1); setSearch(""); }}>Anterior</button><button className="ui-button" disabled={customers.length < 20 || customersQuery.isFetching || customersQuery.isError} onClick={() => { setPage(page + 1); setSearch(""); }}>Siguiente<Icon name="arrow" size={16} /></button></div></div>
        </section>
    </main>;
}
