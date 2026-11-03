
import type { PipelineStage } from "../../pipelines/tyes/pipeline.types";
import type { Deal } from "../types/deal.tpes";
import { useDroppable } from "@dnd-kit/core";
import DraggableDealCard from "./DraggableDealCard";

interface KanbanColumnProps {
    stage: PipelineStage;
    deals: Deal[];
    disabled: boolean;
}

export default function KanbanColumn({
    stage,
    deals,
    disabled,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id,
        data: { type: "stage" },
        disabled,
    });

    return (
        <section
            ref={setNodeRef}
            aria-label={stage.name}
            data-stage-id={stage.id}
            style={{
                flex: "0 0 280px",
                minHeight: "240px",
                background: isOver ? "#dbeafe" : "#f1f5f9",
                outline: isOver ? "2px solid #2563eb" : "2px solid transparent",
                transition: "background 120ms ease, outline-color 120ms ease",
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
                    <DraggableDealCard key={deal.id} deal={deal} disabled={disabled} />
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
