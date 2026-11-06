import { useState } from "react";
import Icon from "../../../shared/ui/Icon";
import FetchNotice from "../../../shared/ui/FetchNotice";
import { useCrmSummary } from "../hooks/useCrmSummary";
import { useRecentDeals } from "../../deals";
import { formatMoney } from "../../../shared/lib/formatMoney";
import { isAccessError } from "../../../shared/api/errors";
import { selectAmounts } from "../model/summary";
import { useCustomers } from "../../customers";

import MetricStrip from "../components/MetricStrip";
import PipelineHealth from "../components/PipelineHealth";
import ValuePanel from "../components/ValuePanel";
import RecentDealsPanel from "../components/RecentDealsPanel";
import CustomersPanel from "../components/CustomersPanel";

export default function DashboardPage({ detailed = false }: { detailed?: boolean }) {
    const summaryQuery = useCrmSummary();
    const dealsQuery = useRecentDeals();
    const customersQuery = useCustomers(0, 4);
    const [currencyId, setCurrencyId] = useState("");
    const summary = isAccessError(summaryQuery.error) ? undefined : summaryQuery.data;
    const amounts = selectAmounts(summary, currencyId);
    const currency = amounts?.currency ?? "USD";
    const recentDeals = isAccessError(dealsQuery.error) ? [] : (dealsQuery.data ?? []);
    const customers = isAccessError(customersQuery.error) ? [] : (customersQuery.data ?? []);

    return (
        <main
            className="dashboard-page"
            aria-label={detailed ? "Analítica comercial" : "Vista general del CRM"}
        >
            <div className="page-section-heading">
                <div>
                    <p className="eyebrow">TU NEGOCIO, EN PERSPECTIVA</p>
                    <h2>
                        {detailed ? "Analítica comercial" : "Todo empieza con una buena relación."}
                    </h2>
                </div>
                <label className="currency-select">
                    <span>Moneda</span>
                    <select
                        aria-label="Moneda de los indicadores"
                        value={currency}
                        onChange={(event) => setCurrencyId(event.target.value)}
                        disabled={!amounts}
                    >
                        {summary?.amounts_by_currency.length ? (
                            summary.amounts_by_currency.map((item) => (
                                <option key={item.currency}>{item.currency}</option>
                            ))
                        ) : (
                            <option>USD</option>
                        )}
                    </select>
                </label>
            </div>
            {summaryQuery.isError && (
                <FetchNotice
                    error={summaryQuery.error}
                    retry={() => void summaryQuery.refetch()}
                    busy={summaryQuery.isFetching}
                />
            )}
            {summaryQuery.isPending && (
                <p className="loading-line" role="status">
                    Cargando el resumen de tu negocio…
                </p>
            )}
            <div className="dashboard-grid">
                <MetricStrip summary={summary} amounts={amounts} currency={currency} />

                <PipelineHealth summary={summary} />

                <ValuePanel amounts={amounts} currency={currency} hasSummary={Boolean(summary)} />

                <RecentDealsPanel
                    deals={recentDeals}
                    error={dealsQuery.error}
                    pending={dealsQuery.isPending}
                    busy={dealsQuery.isFetching}
                    retry={() => void dealsQuery.refetch()}
                />

                <CustomersPanel
                    customers={customers}
                    error={customersQuery.error}
                    pending={customersQuery.isPending}
                    busy={customersQuery.isFetching}
                    retry={() => void customersQuery.refetch()}
                />
            </div>
            {detailed && (
                <section className="surface currency-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Valor por moneda</h2>
                            <p>Los importes se mantienen separados por divisa.</p>
                        </div>
                        <Icon name="analytics" />
                    </div>
                    <div className="table-scroll">
                        <table className="crm-table">
                            <thead>
                                <tr>
                                    <th>Moneda</th>
                                    <th>En proceso</th>
                                    <th>Ganadas</th>
                                    <th>Perdidas</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary?.amounts_by_currency.map((item) => (
                                    <tr key={item.currency}>
                                        <td>
                                            <strong>{item.currency}</strong>
                                        </td>
                                        <td>{formatMoney(item.open_amount, item.currency)}</td>
                                        <td>{formatMoney(item.won_amount, item.currency)}</td>
                                        <td>{formatMoney(item.lost_amount, item.currency)}</td>
                                        <td>
                                            <strong>
                                                {formatMoney(item.total_amount, item.currency)}
                                            </strong>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </main>
    );
}
