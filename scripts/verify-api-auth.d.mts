export function verifyApiAuth(options: {
    baseUrl: string;
    request?: typeof fetch;
    log?: (message: string) => void;
}): Promise<number>;
