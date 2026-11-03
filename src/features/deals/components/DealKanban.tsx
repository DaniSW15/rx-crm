import { useState } from "react";
import { createPortal } from "react-dom";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { CollisionDetection, DragEndEvent } from "@dnd-kit/core";
import type { Pipeline } from "../../pipelines/tyes/pipeline.types";
import type { Deal } from "../types/deal.tpes";
import { useMoveDeal } from "../hooks/useMoveDeal";
import DealCard from "./DealCard";
import KanbanColumn from "./KanbanColumn";
import { kanbanKeyboardCoordinates } from "./kanbanKeyboardCoordinates";

interface DealKanbanProps {
    pipeline: Pipeline;
    deals: Deal[];
}

// Pointer drops outside the board must not select the nearest column.
const columnCollision: CollisionDetection = (args) =>
    args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);

export default function DealKanban({ pipeline, deals }: DealKanbanProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const move = useMoveDeal(pipeline);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: kanbanKeyboardCoordinates }),
    );
    const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);
    const stageIds = new Set(stages.map((stage) => stage.id));
    const unmatchedDeals = deals.filter((deal) => !stageIds.has(deal.stage_id));
    const activeDeal = deals.find((deal) => deal.id === activeId);
    const dealName = (id: string | number) => deals.find((deal) => deal.id === id)?.title ?? "Oportunidad";
    const stageName = (id: string | number) => stages.find((stage) => stage.id === id)?.name ?? "etapa";

    function handleDragEnd({ active, over }: DragEndEvent) {
        setActiveId(null);
        if (!over || move.isMoving || over.data.current?.type !== "stage") return;
        const deal = deals.find((item) => item.id === active.id);
        const stage = stages.find((item) => item.id === over.id);
        if (!deal || !stage || deal.pipeline_id !== pipeline.id || deal.stage_id === stage.id) return;
        move.mutate({ dealId: deal.id, stageId: stage.id });
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={columnCollision}
            onDragStart={({ active }) => {
                move.reset();
                setActiveId(String(active.id));
            }}
            onDragCancel={() => setActiveId(null)}
            onDragEnd={handleDragEnd}
            accessibility={{
                screenReaderInstructions: {
                    draggable: "Pulsa Espacio o Enter para tomar la oportunidad. Usa las flechas izquierda y derecha para cambiar de etapa. Pulsa Espacio o Enter para soltar, o Escape para cancelar.",
                },
                announcements: {
                    onDragStart: ({ active }) => `Tomaste ${dealName(active.id)}.`,
                    onDragOver: ({ over }) => over ? `Etapa de destino: ${stageName(over.id)}.` : "Fuera de las etapas.",
                    onDragEnd: ({ active, over }) => over
                        ? `Soltaste ${dealName(active.id)} en ${stageName(over.id)}.`
                        : "Movimiento cancelado.",
                    onDragCancel: () => "Movimiento cancelado.",
                },
            }}
        >
            <p style={{ marginBottom: "16px" }}>
                Arrastra desde el botón Mover para cambiar de etapa. Con teclado:
                Espacio para tomar, flechas izquierda y derecha para elegir etapa,
                Espacio para soltar y Escape para cancelar.
            </p>

            <div role="status" aria-live="polite">
                {move.isMoving ? "Guardando movimiento..." : move.isSuccess
                    ? `Movimiento guardado en ${stageName(move.data.stage_id)}.` : ""}
            </div>

            {move.isError && (
                <div role="alert" style={{ marginBottom: "16px" }}>
                    <p>No se pudo mover la oportunidad: {move.error.message}</p>
                    <p>Se restauró la etapa anterior.</p>
                    <button type="button" onClick={() => move.reset()}>Cerrar aviso</button>
                </div>
            )}

            {unmatchedDeals.length > 0 && (
                <p role="alert">
                    Atención: {unmatchedDeals.length} oportunidades tienen una
                    etapa que no aparece en este pipeline.
                </p>
            )}

            <div style={{ display: "flex", gap: "16px", overflowX: "auto", alignItems: "flex-start", padding: "4px 4px 20px" }}>
                {stages.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        stage={stage}
                        deals={deals.filter((deal) => deal.stage_id === stage.id)}
                        disabled={move.isMoving}
                    />
                ))}
            </div>

            {createPortal(
                <DragOverlay dropAnimation={null}>
                    {activeDeal ? <div aria-hidden="true"><DealCard deal={activeDeal} /></div> : null}
                </DragOverlay>,
                document.body,
            )}
        </DndContext>
    );
}
