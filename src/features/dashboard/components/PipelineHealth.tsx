import type { CSSProperties } from "react";
import Icon from "../../../shared/ui/Icon";
import { pipelineDistribution, type CrmSummary } from "../model/summary";

export default function PipelineHealth({ summary }: { summary: CrmSummary | undefined }) {
    const { total, wonPercent, openPercent } = pipelineDistribution(summary);
    return (
        <section className="surface pipeline-health">
            <div className="panel-heading">
                <div>
                    <h2>Tu pipeline</h2>
                    <p>Todas las oportunidades, por estado.</p>
                </div>
                <Icon name="deals" />
            </div>
            <div
                className="pipeline-donut"
                role="img"
                aria-label={
                    summary
                        ? `${wonPercent}% de oportunidades ganadas; ${total} oportunidades en total`
                        : "Sin datos de oportunidades"
                }
                style={
                    {
                        "--donut-fill":
                            total > 0
                                ? `conic-gradient(var(--mint) 0% ${wonPercent}%, var(--rose) ${wonPercent}% ${Math.min(100, wonPercent + openPercent)}%, var(--chart-track) ${Math.min(100, wonPercent + openPercent)}% 100%)`
                                : "var(--chart-track)",
                    } as CSSProperties
                }
            >
                <div>
                    <strong>{summary ? `${wonPercent}%` : "—"}</strong>
                    <span>
                        oportunidades
                        <br />
                        ganadas del total
                    </span>
                </div>
            </div>
            <div className="donut-legend">
                <span>
                    <i className="legend-dot is-mint" />
                    Ganadas <strong>{summary?.won_opportunities ?? "—"}</strong>
                </span>
                <span>
                    <i className="legend-dot is-rose" />
                    En proceso <strong>{summary?.open_opportunities ?? "—"}</strong>
                </span>
                <span>
                    <i className="legend-dot is-muted" />
                    Perdidas <strong>{summary?.lost_opportunities ?? "—"}</strong>
                </span>
            </div>
        </section>
    );
}
