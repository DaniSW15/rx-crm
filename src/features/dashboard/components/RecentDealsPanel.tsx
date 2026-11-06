import { useState } from "react";
import { Link } from "react-router";
import Icon from "../../../shared/ui/Icon";
import FetchNotice from "../../../shared/ui/FetchNotice";
import { formatMoney } from "../../../shared/lib/formatMoney";
import type { Deal } from "../../deals";

const statusLabels = { OPEN: "En proceso", WON: "Ganada", LOST: "Perdida" };

export default function RecentDealsPanel({
    deals,
    error,
    pending,
    busy,
    retry,
}: {
    deals: Deal[];
    error: Error | null;
    pending: boolean;
    busy: boolean;
    retry: () => void;
}) {
    const [search, setSearch] = useState("");
    const filteredDeals = deals.filter((deal) =>
        deal.title.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")),
    );
    return (
        <section className="surface recent-panel">
            <div className="panel-heading">
                <div>
                    <h2>Oportunidades recientes</h2>
                    <p>Las conversaciones que están tomando forma.</p>
                </div>
                <Link className="text-link" to="/deals">
                    Ver tablero
                    <Icon name="arrow" size={17} />
                </Link>
            </div>
            <label className="search-field">
                <Icon name="search" size={18} />
                <input
                    aria-label="Buscar oportunidades recientes"
                    placeholder="Buscar en las 5 más recientes…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </label>
            {error && <FetchNotice error={error} retry={retry} busy={busy} />}
            <div className="table-scroll">
                <table className="crm-table">
                    <thead>
                        <tr>
                            <th>Oportunidad</th>
                            <th>Importe</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDeals.map((deal, index) => (
                            <tr key={deal.id}>
                                <td>
                                    <Link className="table-title" to="/deals">
                                        <span className={`table-avatar avatar-tone-${index % 3}`}>
                                            <Icon name="deals" size={21} />
                                        </span>
                                        <span>
                                            <strong>{deal.title}</strong>
                                            <small>
                                                {deal.expected_close_date
                                                    ? `Cierre previsto · ${deal.expected_close_date}`
                                                    : "Sin fecha de cierre"}
                                            </small>
                                        </span>
                                    </Link>
                                </td>
                                <td className="amount-cell">
                                    {formatMoney(deal.amount, deal.currency)}
                                    <small>{deal.currency}</small>
                                </td>
                                <td>
                                    <span
                                        className={`status-pill status-${deal.status.toLowerCase()}`}
                                    >
                                        {statusLabels[deal.status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {pending && (
                <p className="empty-panel" role="status">
                    Cargando oportunidades…
                </p>
            )}
            {!pending && !error && filteredDeals.length === 0 && (
                <p className="empty-panel">
                    {search
                        ? "No hay coincidencias en las oportunidades recientes."
                        : "Tu próxima oportunidad empieza aquí. Encuéntrala en el tablero."}
                </p>
            )}
        </section>
    );
}
