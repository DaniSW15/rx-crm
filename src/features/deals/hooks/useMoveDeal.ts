import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../auth";
import type { Pipeline } from "../../pipelines";
import { dealKeys } from "../api/dealKeys";
import { moveDealStage } from "../api/deals.api";
import type { Deal } from "../types/deal.types";
import { flattenDeals, updateCachedDeal, type DealPages } from "./dealCache";

interface MoveDealInput {
    dealId: string;
    stageId: string;
}

interface MoveContext {
    queryKey: ReturnType<typeof dealKeys.list>;
    token: string;
    tenantId: string;
    previousDeal: Deal;
}

export function useMoveDeal(pipeline: Pipeline) {
    const queryClient = useQueryClient();
    const token = useAuthStore((state) => state.token);
    const tenantId = useAuthStore((state) => state.user?.tenant_id);
    const queryKey = dealKeys.list(tenantId, pipeline.id);
    const mutationKey = dealKeys.move(tenantId, pipeline.id);
    const pendingMoves = useIsMutating({ mutationKey });

    // Do not recreate private cache entries after logout or an account change.
    function canUpdateCache(context: Pick<MoveContext, "queryKey" | "token" | "tenantId">) {
        const session = useAuthStore.getState();
        return (
            session.token === context.token &&
            session.user?.tenant_id === context.tenantId &&
            queryClient.getQueryState(context.queryKey) !== undefined
        );
    }

    const mutation = useMutation({
        mutationKey,
        retry: false,
        mutationFn: ({ dealId, stageId }: MoveDealInput) => {
            if (!token || !tenantId) throw new Error("No existe una sesión activa");
            return moveDealStage(token, dealId, stageId);
        },
        onMutate: async ({ dealId, stageId }): Promise<MoveContext> => {
            if (!token || !tenantId) throw new Error("No existe una sesión activa");
            if (!pipeline.is_active) throw new Error("El embudo no está activo");
            const stage = pipeline.stages.find((item) => item.id === stageId);
            if (!stage || stage.pipeline_id !== pipeline.id) {
                throw new Error("La etapa no pertenece a este embudo");
            }

            await queryClient.cancelQueries({ queryKey, exact: true });

            const cached = queryClient.getQueryData<DealPages>(queryKey);
            const previousDeal = cached && flattenDeals(cached).find((deal) => deal.id === dealId);
            if (
                !canUpdateCache({ queryKey, token, tenantId }) ||
                !previousDeal ||
                previousDeal.tenant_id !== tenantId ||
                previousDeal.pipeline_id !== pipeline.id
            ) {
                throw new Error("La oportunidad no está disponible en este embudo");
            }
            if (previousDeal.status !== "OPEN") {
                throw new Error("Las oportunidades cerradas no se pueden mover");
            }

            queryClient.setQueryData<DealPages>(queryKey, (data) =>
                updateCachedDeal(data, dealId, (deal) => ({ ...deal, stage_id: stageId })),
            );

            return { previousDeal, queryKey, token, tenantId };
        },
        onError: (_error, { dealId }, context) => {
            if (!context || !canUpdateCache(context)) return;
            // Restore only this card, preserving updates to other opportunities.
            queryClient.setQueryData<DealPages>(context.queryKey, (data) =>
                updateCachedDeal(data, dealId, () => context.previousDeal),
            );
        },
        onSuccess: (updatedDeal, { dealId }, context) => {
            if (!context || !canUpdateCache(context)) return;
            queryClient.setQueryData<DealPages>(context.queryKey, (data) =>
                updateCachedDeal(data, dealId, () => updatedDeal),
            );
        },
        onSettled: (_data, _error, _variables, context) => {
            if (context && canUpdateCache(context)) {
                return queryClient.invalidateQueries({ queryKey: context.queryKey, exact: true });
            }
        },
    });

    return { ...mutation, isMoving: pendingMoves > 0 || mutation.isPending };
}
