import { useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { ApiError } from "../../../shared/api/http";
import { useAuthStore } from "../../auth";
import { usePipelines } from "../../pipelines";
import { useDeals } from "../hooks/useDeals";
import DealKanban from "../components/DealKanban";
import "../components/kanban.css";

function PageHeading() {
    return (
        <>
            <h2>Pipeline de ventas</h2>
            <p className="deals-page__intro">Consulta tus oportunidades y organízalas por etapa.</p>
        </>
    );
}

function RequestFailure({
    error,
    onRetry,
    loading,
}: {
    error: Error;
    onRetry: () => void;
    loading: boolean;
}) {
    const unauthorized = error instanceof ApiError && error.status === 401;
    return (
        <div className="kanban-notice kanban-notice--error" role="alert">
            <p>
                {unauthorized
                    ? "Tu sesión no es válida. Inicia sesión de nuevo para continuar."
                    : error.message}
            </p>
            <div className="kanban-notice__actions">
                {unauthorized ? (
                    <a href="/login" className="kanban-button">
                        Iniciar sesión
                    </a>
                ) : (
                    <button
                        className="kanban-button"
                        type="button"
                        onClick={onRetry}
                        disabled={loading}
                    >
                        {loading ? "Actualizando..." : "Volver a intentar"}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function DealsPage() {
    const [selectedId, setSelectedId] = useState("");
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    const isMoving = useIsMutating({ mutationKey: ["move-deal", tenantId] }) > 0;
    const pipelinesQuery = usePipelines();
    const pipelines = (pipelinesQuery.data ?? []).filter((pipeline) => pipeline.is_active);
    const selectedPipeline =
        pipelines.find((pipeline) => pipeline.id === selectedId) ??
        pipelines.find((pipeline) => pipeline.is_default) ??
        pipelines[0];
    const dealsQuery = useDeals(selectedPipeline?.id);
    const refreshing = pipelinesQuery.isFetching || dealsQuery.isFetching;

    function refreshBoard() {
        if (isMoving) return;
        void Promise.allSettled([
            pipelinesQuery.refetch(),
            ...(selectedPipeline ? [dealsQuery.refetch()] : []),
        ]);
    }

    if (!token || !tenantId) {
        return (
            <main className="deals-page">
                <PageHeading />
                <p className="kanban-notice">
                    Inicia sesión para consultar las oportunidades de tu organización.
                </p>
                <a className="kanban-button" href="/login">
                    Iniciar sesión
                </a>
            </main>
        );
    }

    const accessError = [pipelinesQuery.error, dealsQuery.error].find(
        (error) => error instanceof ApiError && (error.status === 401 || error.status === 403),
    );
    if (accessError) {
        return (
            <main className="deals-page">
                <PageHeading />
                <RequestFailure error={accessError} onRetry={refreshBoard} loading={refreshing} />
            </main>
        );
    }

    if (pipelinesQuery.isPending) {
        return (
            <main className="deals-page">
                <PageHeading />
                <p role="status">Cargando embudos...</p>
            </main>
        );
    }

    if (pipelinesQuery.isError && !pipelinesQuery.data) {
        return (
            <main className="deals-page">
                <PageHeading />
                <RequestFailure
                    error={pipelinesQuery.error}
                    onRetry={refreshBoard}
                    loading={refreshing}
                />
            </main>
        );
    }

    if (!selectedPipeline) {
        return (
            <main className="deals-page">
                <PageHeading />
                <div className="kanban-notice">
                    <p>
                        {pipelinesQuery.data?.length === 0
                            ? "No hay embudos comerciales registrados para tu organización."
                            : "No hay embudos comerciales activos para tu organización."}
                    </p>
                    <p>
                        Verifica que tu organización tenga un embudo activo con sus etapas y
                        actualiza la lista.
                    </p>
                </div>
                {pipelinesQuery.isError && (
                    <RequestFailure
                        error={pipelinesQuery.error}
                        onRetry={refreshBoard}
                        loading={refreshing}
                    />
                )}
                <button
                    className="kanban-button"
                    type="button"
                    onClick={refreshBoard}
                    disabled={refreshing || isMoving}
                >
                    {refreshing ? "Actualizando..." : "Actualizar embudos"}
                </button>
            </main>
        );
    }

    return (
        <main className="deals-page">
            <PageHeading />
            <div className="deals-toolbar">
                <div className="deals-toolbar__field">
                    <label htmlFor="pipeline">Embudo comercial</label>
                    <select
                        id="pipeline"
                        value={selectedPipeline.id}
                        disabled={isMoving}
                        onChange={(event) => setSelectedId(event.target.value)}
                    >
                        {pipelines.map((pipeline) => (
                            <option key={pipeline.id} value={pipeline.id}>
                                {pipeline.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    className="kanban-button"
                    type="button"
                    onClick={refreshBoard}
                    disabled={refreshing || isMoving}
                >
                    {refreshing ? "Actualizando..." : "Actualizar tablero"}
                </button>
            </div>

            {pipelinesQuery.isError && (
                <RequestFailure
                    error={pipelinesQuery.error}
                    onRetry={refreshBoard}
                    loading={refreshing || isMoving}
                />
            )}
            {dealsQuery.isPending && <p role="status">Cargando oportunidades...</p>}
            {dealsQuery.isError && (
                <RequestFailure
                    error={dealsQuery.error}
                    onRetry={refreshBoard}
                    loading={refreshing || isMoving}
                />
            )}
            {dealsQuery.data && (
                <>
                    <p className="deals-summary">
                        {dealsQuery.data.length}{" "}
                        {dealsQuery.data.length === 1
                            ? "oportunidad cargada"
                            : "oportunidades cargadas"}
                    </p>
                    {dealsQuery.hasNextPage && (
                        <p className="deals-summary">
                            Los conteos incluyen las oportunidades cargadas. Puede haber más en este
                            embudo.
                        </p>
                    )}
                    <DealKanban
                        key={selectedPipeline.id}
                        pipeline={selectedPipeline}
                        deals={dealsQuery.data}
                    />
                    {dealsQuery.hasNextPage && (
                        <button
                            className="kanban-button"
                            type="button"
                            disabled={dealsQuery.isFetching || isMoving}
                            onClick={() => void dealsQuery.fetchNextPage()}
                        >
                            {dealsQuery.isFetchingNextPage
                                ? "Cargando más..."
                                : "Cargar más oportunidades"}
                        </button>
                    )}
                </>
            )}
        </main>
    );
}
