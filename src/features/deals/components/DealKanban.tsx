import { useId, useState } from "react";
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
import type { Pipeline } from "../../pipelines";
import type { Deal } from "../types/deal.types";
import { useMoveDeal } from "../hooks/useMoveDeal";
import DealCard from "./DealCard";
import KanbanColumn from "./KanbanColumn";
import { kanbanKeyboardCoordinates } from "./kanbanKeyboardCoordinates";
import MoveErrorNotice from "./MoveErrorNotice";
import "./kanban.css";

interface DealKanbanProps {
    pipeline: Pipeline;
    deals: Deal[];
}

// Pointer drops outside the board must not select the nearest column.
const columnCollision: CollisionDetection = (args) =>
    args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args);

export default function DealKanban({ pipeline, deals }: DealKanbanProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [focusDealId, setFocusDealId] = useState<string | null>(null);
    const instructionsId = useId();
    const move = useMoveDeal(pipeline);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: kanbanKeyboardCoordinates }),
    );
    const stages = pipeline.stages
        .filter((stage) => stage.pipeline_id === pipeline.id)
        .sort((a, b) => a.order - b.order);
    const pipelineDeals = deals.filter((deal) => deal.pipeline_id === pipeline.id);
    const stageIds = new Set(stages.map((stage) => stage.id));
    const unmatchedDeals = pipelineDeals.filter((deal) => !stageIds.has(deal.stage_id));
    const activeDeal = pipelineDeals.find((deal) => deal.id === activeId);
    const disabled = move.isMoving || !pipeline.is_active;
    const dealName = (id: string | number) =>
        pipelineDeals.find((deal) => deal.id === id)?.title ?? "Oportunidad";
    const stageName = (id: string | number) =>
        stages.find((stage) => stage.id === id)?.name ?? "etapa";

    function handleDragEnd({ active, over, activatorEvent }: DragEndEvent) {
        setActiveId(null);
        if (!over || disabled || over.data.current?.type !== "stage") return;
        const deal = pipelineDeals.find((item) => item.id === active.id);
        const stage = stages.find((item) => item.id === over.id);
        if (!deal || !stage || deal.status !== "OPEN" || deal.stage_id === stage.id) return;
        setFocusDealId(activatorEvent instanceof KeyboardEvent ? deal.id : null);
        move.mutate({ dealId: deal.id, stageId: stage.id });
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={columnCollision}
            onDragStart={({ active }) => {
                move.reset();
                setFocusDealId(null);
                setActiveId(String(active.id));
            }}
            onDragCancel={() => setActiveId(null)}
            onDragEnd={handleDragEnd}
            accessibility={{
                screenReaderInstructions: {
                    draggable:
                        "Pulsa Espacio o Enter para tomar la oportunidad. Usa las flechas izquierda y derecha para cambiar de etapa. Pulsa Espacio o Enter para soltar, o Escape para cancelar.",
                },
                announcements: {
                    onDragStart: ({ active }) => `Tomaste ${dealName(active.id)}.`,
                    onDragOver: ({ over }) =>
                        over ? `Etapa de destino: ${stageName(over.id)}.` : "Fuera de las etapas.",
                    onDragEnd: ({ active, over }) =>
                        over
                            ? `Soltaste ${dealName(active.id)} en ${stageName(over.id)}.`
                            : "Movimiento cancelado.",
                    onDragCancel: () => "Movimiento cancelado.",
                },
            }}
        >
            <section
                className="deal-kanban"
                aria-label={`Tablero de ${pipeline.name}`}
                aria-describedby={instructionsId}
            >
                <p id={instructionsId} className="deal-kanban__instructions">
                    Arrastra desde el botón Mover para cambiar de etapa. Con teclado: Espacio para
                    tomar, flechas izquierda y derecha para elegir etapa, Espacio para soltar y
                    Escape para cancelar.
                </p>

                <div className="deal-kanban__status" role="status" aria-live="polite">
                    {move.isMoving
                        ? "Guardando movimiento..."
                        : move.isSuccess
                          ? `Movimiento guardado en ${stageName(move.data.stage_id)}.`
                          : ""}
                </div>

                {move.isError && (
                    <MoveErrorNotice error={move.error} onDismiss={() => move.reset()} />
                )}

                {!pipeline.is_active && (
                    <p className="kanban-notice" role="status">
                        Este embudo está inactivo. Sus oportunidades se muestran en modo de
                        consulta.
                    </p>
                )}

                {stages.length === 0 && (
                    <p className="kanban-notice">
                        Este embudo no tiene etapas disponibles. Configura sus etapas para poder
                        mover oportunidades.
                    </p>
                )}

                <div className="deal-kanban__columns">
                    {stages.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            deals={pipelineDeals.filter((deal) => deal.stage_id === stage.id)}
                            disabled={disabled}
                            savingDealId={move.isMoving ? move.variables?.dealId : undefined}
                            focusDealId={focusDealId ?? undefined}
                        />
                    ))}
                </div>

                {unmatchedDeals.length > 0 && (
                    <section
                        className="deal-kanban__unmatched"
                        aria-label="Oportunidades sin etapa disponible"
                    >
                        <h2>Sin etapa disponible</h2>
                        <p role="alert" className="kanban-notice">
                            {unmatchedDeals.length}{" "}
                            {unmatchedDeals.length === 1
                                ? "oportunidad tiene"
                                : "oportunidades tienen"}{" "}
                            una etapa que no aparece en este embudo. Se muestran para consulta
                            mientras se corrige su etapa.
                        </p>
                        {unmatchedDeals.map((deal) => (
                            <DealCard key={deal.id} deal={deal} />
                        ))}
                    </section>
                )}
            </section>

            {createPortal(
                <DragOverlay dropAnimation={null}>
                    {activeDeal ? (
                        <div className="deal-kanban" aria-hidden="true">
                            <DealCard deal={activeDeal} />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body,
            )}
        </DndContext>
    );
}
