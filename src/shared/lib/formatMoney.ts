export function formatMoney(value: string | number | undefined, currency: string): string {
    if (value === undefined) return "—";
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    try {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency,
            currencyDisplay: "narrowSymbol",
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${amount.toLocaleString("es-MX")} ${currency}`;
    }
}
