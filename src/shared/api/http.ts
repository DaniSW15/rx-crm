
type ApiOptions = RequestInit & {
    token?: string;
};

export async function api<T>(
    endpoint: string,
    { token, ...options }: ApiOptions = {}
): Promise<T> {
    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`/api/v1${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let message = `Error HTTP ${response.status}`;

        try {
            const body = (await response.json()) as {
                detail?: unknown;
            };

            if (typeof body.detail === "string") {
                message = body.detail;
            }
        } catch {
            // La respuesta no contiene JSON válido.
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}
