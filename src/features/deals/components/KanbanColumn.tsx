
import type { PipelineStage } from "../../pipelines/tyes/pipeline.types";
import type { Deal } from "../types/deal.tpes";
import DealCard from "./DealCard";

interface KanbanColumnProps {
    stage: PipelineStage;
    deals: Deal[];
}

export default function KanbanColumn({
    stage,
    deals,
}: KanbanColumnProps) {
    return (
        <section
            style={{
                flex: "0 0 280px",
                background: "#f1f5f9",
                borderRadius: "12px",
                padding: "14px",
                color: "#0f172a",
            }}
        >
            <header style={{ marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px" }}>
                    {stage.name}
                </h2>

                <span style={{ color: "#64748b" }}>
                    {deals.length} oportunidades
                </span>
            </header>

            <div>
                {deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                ))}

                {deals.length === 0 && (
                    <p style={{ color: "#64748b" }}>
                        Sin oportunidades
                    </p>
                )}
            </div>
        </section>
    );
}
