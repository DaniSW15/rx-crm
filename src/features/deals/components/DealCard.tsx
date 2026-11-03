import type { Deal } from "../types/deal.tpes";
import type { ReactNode } from "react";

interface DealCardProps {
    deal: Deal;
    dragHandle?: ReactNode;
}

export default function DealCard({ deal, dragHandle }: DealCardProps) {
    const formattedAmount = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: deal.currency,
    }).format(Number(deal.amount));

    return (
        <article
            style={{
                background: "#ffffff",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                marginBottom: "10px",
                color: "#0f172a",
            }}
        >
            {dragHandle}
            <h3 style={{ fontSize: "15px", margin: "0 0 10px" }}>
                {deal.title}
            </h3>

            <strong>{formattedAmount}</strong>

            <p style={{ fontSize: "12px", color: "#64748b" }}>
                Estado: {deal.status}
            </p>
        </article>
    );
}
