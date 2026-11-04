// Read-only deployment check. This deliberately fails against demo authentication.
// No real credentials or response bodies are logged.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const privatePaths = [
    "/api/v1/auth/me",
    "/api/v1/deals?limit=1&offset=0",
    "/api/v1/pipelines",
    "/api/v1/customers/?limit=1&offset=0",
    "/api/v1/analytics/summary/",
    "/api/v1/opportunities/?limit=1&offset=0",
];

const attempts = [
    { name: "sin JWT", headers: {} },
    { name: "JWT inválido", headers: { Authorization: "Bearer invalid-auth-review-token" } },
    { name: "Bearer vacío", headers: { Authorization: "Bearer" } },
    {
        name: "headers de organización sin JWT",
        headers: {
            "X-Tenant-ID": "00000000-0000-0000-0000-000000000001",
            "X-User-ID": "00000000-0000-0000-0000-000000000002",
        },
    },
];

export async function verifyApiAuth({ baseUrl, request = fetch, log = console.log }) {
    const target = new URL(baseUrl);
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
        throw new Error("Usa una URL HTTP(S) sin credenciales.");
    }
    let failures = 0;
    for (const path of privatePaths) {
        for (const attempt of attempts) {
            const label = `${attempt.name} GET ${path}`;
            try {
                const response = await request(new URL(path, target), {
                    method: "GET",
                    headers: attempt.headers,
                    redirect: "manual",
                    signal: AbortSignal.timeout(5000),
                });
                const challenge = response.headers.get("WWW-Authenticate") ?? "";
                const passed = response.status === 401 && /^Bearer(?:\s|$)/i.test(challenge);
                if (!passed) failures++;
                log(`${passed ? "PASS" : "FAIL"} ${label}: HTTP ${response.status}; Bearer challenge=${/^Bearer(?:\s|$)/i.test(challenge)}`);
                await response.body?.cancel();
            } catch {
                failures++;
                log(`FAIL ${label}: no se pudo completar la petición`);
            }
        }
    }
    log(`${privatePaths.length * attempts.length} comprobaciones; ${failures} fallos.`);
    log("Alcance: rechazo de peticiones sin credenciales válidas. No demuestra aislamiento con JWT válidos ni concurrencia.");
    return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const failures = await verifyApiAuth({
            baseUrl: process.env.API_AUTH_BASE_URL ?? "http://127.0.0.1:8000",
        });
        process.exitCode = failures > 0 ? 1 : 0;
    } catch (error) {
        console.error(error instanceof Error ? error.message : "No se pudo verificar la API.");
        process.exitCode = 1;
    }
}
