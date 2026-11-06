import type { InfiniteData } from "@tanstack/react-query";
import type { Deal } from "../types/deal.types";

export type DealPages = InfiniteData<Deal[], number>;

export function flattenDeals(data: DealPages): Deal[] {
    return [...new Map(data.pages.flat().map((deal) => [deal.id, deal])).values()];
}

export function updateCachedDeal(
    data: DealPages | undefined,
    id: string,
    update: (deal: Deal) => Deal,
): DealPages | undefined {
    if (!data) return data;
    return {
        ...data,
        pages: data.pages.map((page) => page.map((deal) => (deal.id === id ? update(deal) : deal))),
    };
}
