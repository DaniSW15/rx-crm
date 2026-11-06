type ApiOptions<T> = RequestInit & {
    token?: string;
    schema?: { parse: (input: unknown) => T };
};

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export async function api<T>(
    endpoint: string,
    { token, schema, ...options }: ApiOptions<T> = {},
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
            } else if (Array.isArray(body.detail)) {
                const messages = body.detail.flatMap((item: unknown) => {
                    if (
                        item &&
                        typeof item === "object" &&
                        "msg" in item &&
                        typeof item.msg === "string"
                    ) {
                        return [item.msg];
                    }
                    return [];
                });
                if (messages.length > 0) message = messages.join(" ");
            }
        } catch {
            // La respuesta no contiene JSON válido.
        }

        throw new ApiError(response.status, message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const body: unknown = await response.json();
    if (!schema) return body as T;
    try {
        return schema.parse(body);
    } catch {
        // Never expose response contents (including private fields) in validation errors.
        throw new Error(
            "La respuesta del servidor tiene un formato inesperado. Actualiza e inténtalo de nuevo.",
        );
    }
}
