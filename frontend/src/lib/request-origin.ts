export interface MutationOriginInput {
    method: string;
    expectedOrigin: string;
    origin?: string | null;
    referer?: string | null;
}

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isStateChangingMethod(method: string): boolean {
    return STATE_CHANGING_METHODS.has(method.toUpperCase());
}

export function isTrustedMutationOrigin(input: MutationOriginInput): boolean {
    if (!isStateChangingMethod(input.method)) return true;
    if (input.origin) return input.origin === input.expectedOrigin;

    if (input.referer) {
        try {
            return new URL(input.referer).origin === input.expectedOrigin;
        } catch {
            return false;
        }
    }

    return false;
}
