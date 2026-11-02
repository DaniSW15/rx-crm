import type { Pipeline } from "../../pipelines/tyes/pipeline.types";
import type { Deal } from "../types/deal.tpes";
import KanbanColumn from "./KanbanColumn";

interface DealKanbanProps {
    pipeline: Pipeline;
    deals: Deal[];
}

export default function DealKanban({
    pipeline,
    deals,
}: DealKanbanProps) {
    const stages = [...pipeline.stages].sort(
        (a, b) => a.order - b.order
    );

    const stageIds = new Set(
        stages.map((stage) => stage.id)
    );

    const unmatchedDeals = deals.filter(
        (deal) => !stageIds.has(deal.stage_id)
    );

    return (
        <div>
            {unmatchedDeals.length > 0 && (
                <p role="alert">
                    Atención: {unmatchedDeals.length} oportunidades
                    tienen una etapa que no aparece en este pipeline.
                </p>
            )}

            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    overflowX: "auto",
                    alignItems: "flex-start",
                    paddingBottom: "20px",
                }}
            >
                {stages.map((stage) => {
                    const stageDeals = deals.filter(
                        (deal) => deal.stage_id === stage.id
                    );

                    return (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            deals={stageDeals}
                        />
                    );
                })}
            </div>
        </div>
    );
}
