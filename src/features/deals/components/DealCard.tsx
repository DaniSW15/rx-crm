import type { Deal } from "../types/deal.types";
import type { ReactNode } from "react";

interface DealCardProps {
    deal: Deal;
    dragHandle?: ReactNode;
}

export default function DealCard({ deal, dragHandle }: DealCardProps) {
    let formattedAmount = `${deal.amount} ${deal.currency}`;
    const amount = Number(deal.amount);
    if (Number.isFinite(amount)) {
        try {
            formattedAmount = new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: deal.currency,
                currencyDisplay: "code",
            }).format(amount);
        } catch {
            // Preserve the supplied currency if it is not an ISO currency code.
        }
    }

    return (
        <article className="deal-card" aria-label={deal.title} tabIndex={-1}>
            {dragHandle && <div className="deal-card__controls">{dragHandle}</div>}
            <h3 className="deal-card__title">{deal.title}</h3>

            <strong>{formattedAmount}</strong>

            <p className="deal-card__meta">Estado: {deal.status}</p>
            {deal.expected_close_date && (
                <p className="deal-card__meta">
                    Cierre previsto:{" "}
                    <time dateTime={deal.expected_close_date}>{deal.expected_close_date}</time>
                </p>
            )}
            {deal.lost_reason && (
                <p className="deal-card__meta">Motivo de pérdida: {deal.lost_reason}</p>
            )}
        </article>
    );
}
