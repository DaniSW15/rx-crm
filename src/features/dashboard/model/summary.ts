import { z } from "zod";

const amount = z.string().regex(/^-?\d+(\.\d+)?$/);
export const summarySchema = z.object({
    total_customers: z.number().int().nonnegative(),
    total_opportunities: z.number().int().nonnegative(),
    open_opportunities: z.number().int().nonnegative(),
    won_opportunities: z.number().int().nonnegative(),
    lost_opportunities: z.number().int().nonnegative(),
    amounts_by_currency: z.array(
        z.object({
            currency: z.string().min(1),
            open_amount: amount,
            won_amount: amount,
            lost_amount: amount,
            total_amount: amount,
        }),
    ),
});
export type CrmSummary = z.infer<typeof summarySchema>;
export type CurrencyAmounts = CrmSummary["amounts_by_currency"][number];

export function selectAmounts(summary: CrmSummary | undefined, currency: string) {
    return (
        summary?.amounts_by_currency.find((item) => item.currency === currency) ??
        summary?.amounts_by_currency[0]
    );
}

export function pipelineDistribution(summary: CrmSummary | undefined) {
    const total = summary?.total_opportunities ?? 0;
    return {
        total,
        wonPercent:
            total > 0 && summary ? Math.round((summary.won_opportunities / total) * 100) : 0,
        openPercent: total > 0 && summary ? (summary.open_opportunities / total) * 100 : 0,
    };
}
