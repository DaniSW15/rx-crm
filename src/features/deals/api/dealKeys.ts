export const dealKeys = {
    list: (tenantId: string | undefined, pipelineId: string | undefined) =>
        ["deals", tenantId, pipelineId] as const,
    move: (tenantId: string | undefined, pipelineId: string) =>
        ["move-deal", tenantId, pipelineId] as const,
};
