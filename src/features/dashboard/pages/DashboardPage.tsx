import { useState } from "react";
import { Link } from "react-router";
import type { CSSProperties } from "react";
import Icon from "../../../shared/ui/Icon";
import FetchNotice from "../../../shared/ui/FetchNotice";
import { useCrmSummary, useRecentDeals, formatMoney, isAccessError } from "../api/dashboard.api";
import { useCustomers } from "../../customers/api/customers.api";

const statusLabels = { OPEN: "En proceso", WON: "Ganada", LOST: "Perdida" };

export default function DashboardPage({ detailed = false }: { detailed?: boolean }) {
    const summaryQuery = useCrmSummary();
    const dealsQuery = useRecentDeals();
    const customersQuery = useCustomers(0, 4);
    const [currencyId, setCurrencyId] = useState("");
    const [search, setSearch] = useState("");
    const summary = isAccessError(summaryQuery.error) ? undefined : summaryQuery.data;
    const amounts = summary?.amounts_by_currency.find((item) => item.currency === currencyId) ?? summary?.amounts_by_currency[0];
    const currency = amounts?.currency ?? "USD";
    const recentDeals = isAccessError(dealsQuery.error) ? [] : dealsQuery.data ?? [];
    const customers = isAccessError(customersQuery.error) ? [] : customersQuery.data ?? [];
    const total = summary?.total_opportunities ?? 0;
    const wonPercent = total > 0 ? Math.round((summary!.won_opportunities / total) * 100) : 0;
    const openPercent = total > 0 ? (summary!.open_opportunities / total) * 100 : 0;
    const distribution = [
        { label: "En proceso", value: amounts?.open_amount ?? "0", className: "is-ivory", count: summary?.open_opportunities ?? 0 },
        { label: "Ganadas", value: amounts?.won_amount ?? "0", className: "is-mint", count: summary?.won_opportunities ?? 0 },
        { label: "Perdidas", value: amounts?.lost_amount ?? "0", className: "is-rose", count: summary?.lost_opportunities ?? 0 },
    ];
    const maxAmount = Math.max(1, ...distribution.map((item) => Number(item.value) || 0));
    const filteredDeals = recentDeals.filter((deal) => deal.title.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")));

    return <main className="dashboard-page" aria-label={detailed ? "Analítica comercial" : "Vista general del CRM"}>
        <div className="page-section-heading"><div><p className="eyebrow">TU NEGOCIO, EN PERSPECTIVA</p><h2>{detailed ? "Analítica comercial" : "Todo empieza con una buena relación."}</h2></div>
            <label className="currency-select"><span>Moneda</span><select aria-label="Moneda de los indicadores" value={currency} onChange={(event) => setCurrencyId(event.target.value)} disabled={!amounts}>
                {summary?.amounts_by_currency.length ? summary.amounts_by_currency.map((item) => <option key={item.currency}>{item.currency}</option>) : <option>USD</option>}
            </select></label>
        </div>
        {summaryQuery.isError && <FetchNotice error={summaryQuery.error} retry={() => void summaryQuery.refetch()} busy={summaryQuery.isFetching} />}
        {summaryQuery.isPending && <p className="loading-line" role="status">Cargando el resumen de tu negocio…</p>}
        <div className="dashboard-grid">
            <section className="metric-strip" aria-label="Indicadores comerciales">
                <div className="metric"><span className="metric-icon"><Icon name="wallet" size={26} /></span><div><p>Pipeline abierto <small>{currency}</small></p><strong>{formatMoney(amounts?.open_amount, currency)}</strong><span className="metric-caption">{summary ? "En oportunidades activas" : "Valor por confirmar"}</span></div></div>
                <div className="metric"><span className="metric-icon"><Icon name="target" size={26} /></span><div><p>Ventas ganadas <small>{currency}</small></p><strong>{formatMoney(amounts?.won_amount, currency)}</strong><span className="metric-caption">{summary ? "En oportunidades ganadas" : "Valor por confirmar"}</span></div></div>
                <div className="metric"><span className="metric-icon"><Icon name="customers" size={26} /></span><div><p>Clientes</p><strong>{summary?.total_customers.toLocaleString("es-MX") ?? "—"}</strong><span className="metric-caption">En tu organización</span></div></div>
            </section>

            <section className="surface pipeline-health">
                <div className="panel-heading"><div><h2>Tu pipeline</h2><p>Todas las oportunidades, por estado.</p></div><Icon name="deals" /></div>
                <div className="pipeline-donut" role="img" aria-label={summary ? `${wonPercent}% de oportunidades ganadas; ${total} oportunidades en total` : "Sin datos de oportunidades"}
                    style={{ "--donut-fill": total > 0 ? `conic-gradient(var(--mint) 0% ${wonPercent}%, var(--rose) ${wonPercent}% ${Math.min(100, wonPercent + openPercent)}%, var(--chart-track) ${Math.min(100, wonPercent + openPercent)}% 100%)` : "var(--chart-track)" } as CSSProperties}>
                    <div><strong>{summary ? `${wonPercent}%` : "—"}</strong><span>oportunidades<br />ganadas del total</span></div>
                </div>
                <div className="donut-legend"><span><i className="legend-dot is-mint" />Ganadas <strong>{summary?.won_opportunities ?? "—"}</strong></span><span><i className="legend-dot is-rose" />En proceso <strong>{summary?.open_opportunities ?? "—"}</strong></span><span><i className="legend-dot is-muted" />Perdidas <strong>{summary?.lost_opportunities ?? "—"}</strong></span></div>
            </section>

            <section className="surface value-panel">
                <div className="panel-heading"><div><h2>El valor de tus oportunidades</h2><p>Distribución actual · {currency}</p></div><span className="soft-badge">Por estado</span></div>
                <div className="value-panel__body"><div className="value-total"><span>Valor total del pipeline</span><strong>{formatMoney(amounts?.total_amount, currency)}</strong><p>Una visión completa para decidir<br />tu siguiente paso.</p><Link to="/deals" className="text-link">Explorar oportunidades<Icon name="arrow" size={18} /></Link></div>
                    <div className="value-chart" role="img" aria-label={amounts ? distribution.map((item) => `${item.label}: ${formatMoney(item.value, currency)}`).join("; ") : "Sin importes disponibles"}>
                        {distribution.map((item) => <div className="value-chart__group" key={item.label}><span className="value-chart__amount">{amounts ? formatMoney(item.value, currency) : "—"}</span><div className="value-chart__track"><div className={`value-chart__bar ${item.className}`} style={{ height: `${Math.max(0, Number(item.value) / maxAmount) * 100}%` }} /></div><span>{item.label}</span></div>)}
                    </div>
                </div>
                {summary && !amounts && <p className="subtle-note">Los importes aparecerán al registrar oportunidades.</p>}
            </section>

            <section className="surface recent-panel">
                <div className="panel-heading"><div><h2>Oportunidades recientes</h2><p>Las conversaciones que están tomando forma.</p></div><Link className="text-link" to="/deals">Ver tablero<Icon name="arrow" size={17} /></Link></div>
                <label className="search-field"><Icon name="search" size={18} /><input aria-label="Buscar oportunidades recientes" placeholder="Buscar en las 5 más recientes…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                {dealsQuery.isError && <FetchNotice error={dealsQuery.error} retry={() => void dealsQuery.refetch()} busy={dealsQuery.isFetching} />}
                <div className="table-scroll"><table className="crm-table"><thead><tr><th>Oportunidad</th><th>Importe</th><th>Estado</th></tr></thead><tbody>
                    {filteredDeals.map((deal, index) => <tr key={deal.id}><td><Link className="table-title" to="/deals"><span className={`table-avatar avatar-tone-${index % 3}`}><Icon name="deals" size={21} /></span><span><strong>{deal.title}</strong><small>{deal.expected_close_date ? `Cierre previsto · ${deal.expected_close_date}` : "Sin fecha de cierre"}</small></span></Link></td><td className="amount-cell">{formatMoney(deal.amount, deal.currency)}<small>{deal.currency}</small></td><td><span className={`status-pill status-${deal.status.toLowerCase()}`}>{statusLabels[deal.status]}</span></td></tr>)}
                </tbody></table></div>
                {dealsQuery.isPending && <p className="empty-panel" role="status">Cargando oportunidades…</p>}
                {!dealsQuery.isPending && !dealsQuery.isError && filteredDeals.length === 0 && <p className="empty-panel">{search ? "No hay coincidencias en las oportunidades recientes." : "Tu próxima oportunidad empieza aquí. Encuéntrala en el tablero."}</p>}
            </section>

            <section className="surface customer-panel">
                <div className="panel-heading"><div><h2>Últimos clientes</h2><p>Relaciones con nombre propio.</p></div><Link className="icon-button" aria-label="Ver todos los clientes" to="/customers"><Icon name="arrow" size={19} /></Link></div>
                {customersQuery.isError && <FetchNotice error={customersQuery.error} retry={() => void customersQuery.refetch()} busy={customersQuery.isFetching} />}
                <div className="customer-list">{customers.map((customer, index) => <Link className="customer-list__item" key={customer.id} to="/customers"><span className={`customer-avatar avatar-tone-${index % 3}`}>{customer.name.slice(0, 2).toUpperCase()}</span><span><strong>{customer.name}</strong><small>{customer.industry || customer.phone || "Cliente de tu organización"}</small></span><Icon name="arrow" size={16} /></Link>)}</div>
                {customersQuery.isPending && <p className="empty-panel" role="status">Cargando clientes…</p>}
                {!customersQuery.isPending && !customersQuery.isError && customers.length === 0 && <p className="empty-panel">Tus clientes aparecerán aquí cuando se registren en tu organización.</p>}
                <div className="relationship-note"><span className="relationship-mark"><Icon name="customers" size={28} /></span><p>Detrás de cada venta,<br /><strong>hay una buena relación.</strong></p></div>
            </section>
        </div>
        {detailed && <section className="surface currency-panel"><div className="panel-heading"><div><h2>Valor por moneda</h2><p>Los importes se mantienen separados por divisa.</p></div><Icon name="analytics" /></div><div className="table-scroll"><table className="crm-table"><thead><tr><th>Moneda</th><th>En proceso</th><th>Ganadas</th><th>Perdidas</th><th>Total</th></tr></thead><tbody>{summary?.amounts_by_currency.map((item) => <tr key={item.currency}><td><strong>{item.currency}</strong></td><td>{formatMoney(item.open_amount, item.currency)}</td><td>{formatMoney(item.won_amount, item.currency)}</td><td>{formatMoney(item.lost_amount, item.currency)}</td><td><strong>{formatMoney(item.total_amount, item.currency)}</strong></td></tr>)}</tbody></table></div></section>}
    </main>;
}
