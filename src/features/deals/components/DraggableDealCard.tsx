import { useDraggable } from "@dnd-kit/core";
import type { Deal } from "../types/deal.tpes";
import DealCard from "./DealCard";

interface DraggableDealCardProps {
    deal: Deal;
    disabled: boolean;
}

export default function DraggableDealCard({ deal, disabled }: DraggableDealCardProps) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
        id: deal.id,
        data: { type: "deal", stageId: deal.stage_id },
        disabled,
    });

    return (
        <div ref={setNodeRef} style={{ opacity: isDragging ? 0.35 : 1 }}>
            <DealCard
                deal={deal}
                dragHandle={
                    <button
                        ref={setActivatorNodeRef}
                        type="button"
                        {...attributes}
                        {...listeners}
                        aria-label={`Mover ${deal.title}`}
                        disabled={disabled}
                        title="Arrastra para cambiar de etapa"
                        style={{
                            touchAction: "none",
                            cursor: disabled ? "wait" : isDragging ? "grabbing" : "grab",
                            padding: "6px 12px",
                            marginBottom: "8px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            background: "#f8fafc",
                            color: "#334155",
                        }}
                    >
                        <span aria-hidden="true">⠿</span> Mover
                    </button>
                }
            />
        </div>
    );
}
