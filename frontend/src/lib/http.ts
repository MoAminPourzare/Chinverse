export const isHttpStatus = (error: unknown, status: number) => {
    if (typeof error !== "object" || error === null || !("response" in error)) {
        return false;
    }

    const response = (error as { response?: { status?: number } }).response;
    return response?.status === status;
};
