import Icon from "../../../shared/ui/Icon";
import { formatMoney } from "../../../shared/lib/formatMoney";
import type { CrmSummary, CurrencyAmounts } from "../model/summary";

export default function MetricStrip({
    summary,
    amounts,
    currency,
}: {
    summary: CrmSummary | undefined;
    amounts: CurrencyAmounts | undefined;
    currency: string;
}) {
    return (
        <section className="metric-strip" aria-label="Indicadores comerciales">
            <div className="metric">
                <span className="metric-icon">
                    <Icon name="wallet" size={26} />
                </span>
                <div>
                    <p>
                        Pipeline abierto <small>{currency}</small>
                    </p>
                    <strong>{formatMoney(amounts?.open_amount, currency)}</strong>
                    <span className="metric-caption">
                        {summary ? "En oportunidades activas" : "Valor por confirmar"}
                    </span>
                </div>
            </div>
            <div className="metric">
                <span className="metric-icon">
                    <Icon name="target" size={26} />
                </span>
                <div>
                    <p>
                        Ventas ganadas <small>{currency}</small>
                    </p>
                    <strong>{formatMoney(amounts?.won_amount, currency)}</strong>
                    <span className="metric-caption">
                        {summary ? "En oportunidades ganadas" : "Valor por confirmar"}
                    </span>
                </div>
            </div>
            <div className="metric">
                <span className="metric-icon">
                    <Icon name="customers" size={26} />
                </span>
                <div>
                    <p>Clientes</p>
                    <strong>{summary?.total_customers.toLocaleString("es-MX") ?? "—"}</strong>
                    <span className="metric-caption">En tu organización</span>
                </div>
            </div>
        </section>
    );
}
