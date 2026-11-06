import type { PipelineStage } from "../../pipelines";
import type { Deal } from "../types/deal.types";
import { useDroppable } from "@dnd-kit/core";
import DraggableDealCard from "./DraggableDealCard";

interface KanbanColumnProps {
    stage: PipelineStage;
    deals: Deal[];
    disabled?: boolean;
    savingDealId?: string;
    focusDealId?: string;
}

export default function KanbanColumn({
    stage,
    deals,
    disabled = false,
    savingDealId,
    focusDealId,
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
            aria-busy={disabled}
            data-stage-id={stage.id}
            data-drag-over={isOver}
            className="kanban-column"
            style={{
                outline: isOver ? "2px solid #2563eb" : "2px solid transparent",
            }}
        >
            <header className="kanban-column__header">
                <h2 className="kanban-column__title">{stage.name}</h2>

                <span className="kanban-column__count">
                    {deals.length} {deals.length === 1 ? "oportunidad" : "oportunidades"}
                </span>
            </header>

            <ul className="kanban-column__list" aria-label={`Oportunidades en ${stage.name}`}>
                {deals.map((deal) => (
                    <li key={deal.id}>
                        <DraggableDealCard
                            deal={deal}
                            disabled={disabled}
                            isSaving={deal.id === savingDealId}
                            restoreFocus={deal.id === focusDealId}
                        />
                    </li>
                ))}

                {deals.length === 0 && (
                    <li className="kanban-column__empty">
                        {isOver ? "Suelta aquí la oportunidad" : "Sin oportunidades"}
                    </li>
                )}
            </ul>
        </section>
    );
}
