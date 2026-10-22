export const REQUEST_ID_PATTERN = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9A-HJKMNP-TV-Z]{26})$/i;

export const isValidRequestId = (value: string | null | undefined) => (
    typeof value === "string" && REQUEST_ID_PATTERN.test(value)
);

export const resolveRequestId = (
    value: string | null | undefined,
    create: () => string = () => crypto.randomUUID(),
) => isValidRequestId(value) ? value as string : create();
