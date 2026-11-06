import { useDraggable } from "@dnd-kit/core";
import { useEffect, useRef } from "react";
import type { Deal } from "../types/deal.types";
import DealCard from "./DealCard";

interface DraggableDealCardProps {
    deal: Deal;
    disabled: boolean;
    isSaving?: boolean;
    restoreFocus?: boolean;
}

export default function DraggableDealCard({
    deal,
    disabled,
    isSaving = false,
    restoreFocus = false,
}: DraggableDealCardProps) {
    const closed = deal.status !== "OPEN";
    const handleRef = useRef<HTMLButtonElement>(null);
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
        id: deal.id,
        data: { type: "deal", stageId: deal.stage_id },
        disabled: disabled || closed,
    });

    // Changing columns remounts the card. Restore lost keyboard focus without
    // taking it away from another control the user selected while saving.
    useEffect(() => {
        if (!restoreFocus || document.activeElement !== document.body) return;
        const target = closed
            ? handleRef.current?.closest<HTMLElement>("article")
            : handleRef.current;
        target?.focus({ preventScroll: true });
    }, [restoreFocus, closed, deal.stage_id]);

    return (
        <div ref={setNodeRef} aria-busy={isSaving} style={{ opacity: isDragging ? 0.35 : 1 }}>
            <DealCard
                deal={deal}
                dragHandle={
                    <button
                        ref={(node) => {
                            handleRef.current = node;
                            setActivatorNodeRef(node);
                        }}
                        type="button"
                        {...attributes}
                        {...listeners}
                        aria-label={`Mover ${deal.title}`}
                        disabled={closed}
                        className="deal-drag-handle"
                        title={
                            closed
                                ? "Esta oportunidad está cerrada y no se puede mover"
                                : disabled
                                  ? "Espera a que termine el movimiento actual"
                                  : "Arrastra para cambiar de etapa"
                        }
                    >
                        <span aria-hidden="true">⠿</span>{" "}
                        {isSaving ? "Guardando…" : closed ? "Cerrada" : "Mover"}
                    </button>
                }
            />
        </div>
    );
}
