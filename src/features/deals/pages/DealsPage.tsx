
import { useState } from "react";
import { usePipelines } from "../../pipelines/hooks/usePipelines";
import { useDeals } from "../hooks/useDeals";
import DealKanban from "../components/DealKanban";



export default function DealsPage() {
    const [selectedId, setSelectedId] = useState("");

    const pipelinesQuery = usePipelines();
    const pipelines = (pipelinesQuery.data ?? []).filter(
        (pipeline) => pipeline.is_active
    );

    const selectedPipeline =
        pipelines.find((p) => p.id === selectedId) ??
        pipelines.find((p) => p.is_default) ??
        pipelines[0];

    const dealsQuery = useDeals(selectedPipeline?.id);

    if (pipelinesQuery.isPending) {
        return <p>Cargando pipelines...</p>;
    }

    if (pipelinesQuery.isError) {
        return (
            <p role="alert">
                Error al cargar pipelines:{" "}
                {pipelinesQuery.error.message}
            </p>
        );
    }

    if (!selectedPipeline) {
        return (
            <main style={{ padding: "24px", minWidth: 0 }}>
                <h1>Pipeline de ventas</h1>
                <p>
                    {pipelinesQuery.data.length === 0
                        ? "No hay embudos comerciales registrados para tu organización."
                        : "No hay embudos comerciales activos para tu organización."}
                </p>
                <p>
                    Verifica que exista un embudo activo con sus etapas en la
                    organización de tu sesión. Si acabas de configurarlo,
                    actualiza la lista.
                </p>
                <button
                    type="button"
                    onClick={() => void pipelinesQuery.refetch()}
                    disabled={pipelinesQuery.isFetching}
                >
                    {pipelinesQuery.isFetching
                        ? "Actualizando..."
                        : "Actualizar embudos"}
                </button>
            </main>
        );
    }
    

    return (
        <main style={{ padding: "24px", minWidth: 0 }}>
            <h1>Pipeline de ventas</h1>

            <div style={{ marginBottom: "24px" }}>
                <label htmlFor="pipeline">Embudo comercial: </label>

                <select
                    id="pipeline"
                    value={selectedPipeline.id}
                    onChange={(event) =>
                        setSelectedId(event.target.value)
                    }
                >
                    {pipelines.map((pipeline) => (
                        <option key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                        </option>
                    ))}
                </select>
            </div>

            {dealsQuery.isPending ? (
                <p>Cargando oportunidades...</p>
            ) : dealsQuery.isError ? (
                <p role="alert">
                    Error al cargar oportunidades:{" "}
                    {dealsQuery.error.message}
                </p>
            ) : (
                <>
                    <p>
                        {dealsQuery.data.length} oportunidades cargadas
                    </p>

                    {dealsQuery.data.length === 50 && (
                        <p>
                            Mostrando hasta 50 oportunidades.
                            Incorporaremos paginación después.
                        </p>
                    )}

                    <DealKanban
                        pipeline={selectedPipeline}
                        deals={dealsQuery.data}
                    />
                </>
            )}
        </main>
    );
}
