import { Link } from "react-router";
import Icon from "../../../shared/ui/Icon";
import { formatMoney } from "../../../shared/lib/formatMoney";
import type { CurrencyAmounts } from "../model/summary";

export default function ValuePanel({
    amounts,
    currency,
    hasSummary,
}: {
    amounts: CurrencyAmounts | undefined;
    currency: string;
    hasSummary: boolean;
}) {
    const distribution = [
        { label: "En proceso", value: amounts?.open_amount ?? "0", className: "is-ivory" },
        { label: "Ganadas", value: amounts?.won_amount ?? "0", className: "is-mint" },
        { label: "Perdidas", value: amounts?.lost_amount ?? "0", className: "is-rose" },
    ];
    const maxAmount = Math.max(1, ...distribution.map((item) => Number(item.value) || 0));
    return (
        <section className="surface value-panel">
            <div className="panel-heading">
                <div>
                    <h2>El valor de tus oportunidades</h2>
                    <p>Distribución actual · {currency}</p>
                </div>
                <span className="soft-badge">Por estado</span>
            </div>
            <div className="value-panel__body">
                <div className="value-total">
                    <span>Valor total del pipeline</span>
                    <strong>{formatMoney(amounts?.total_amount, currency)}</strong>
                    <p>
                        Una visión completa para decidir
                        <br />
                        tu siguiente paso.
                    </p>
                    <Link to="/deals" className="text-link">
                        Explorar oportunidades
                        <Icon name="arrow" size={18} />
                    </Link>
                </div>
                <div
                    className="value-chart"
                    role="img"
                    aria-label={
                        amounts
                            ? distribution
                                  .map(
                                      (item) =>
                                          `${item.label}: ${formatMoney(item.value, currency)}`,
                                  )
                                  .join("; ")
                            : "Sin importes disponibles"
                    }
                >
                    {distribution.map((item) => (
                        <div className="value-chart__group" key={item.label}>
                            <span className="value-chart__amount">
                                {amounts ? formatMoney(item.value, currency) : "—"}
                            </span>
                            <div className="value-chart__track">
                                <div
                                    className={`value-chart__bar ${item.className}`}
                                    style={{
                                        height: `${Math.max(0, Number(item.value) / maxAmount) * 100}%`,
                                    }}
                                />
                            </div>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            {hasSummary && !amounts && (
                <p className="subtle-note">Los importes aparecerán al registrar oportunidades.</p>
            )}
        </section>
    );
}
