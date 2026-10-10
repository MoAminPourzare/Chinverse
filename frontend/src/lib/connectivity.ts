export type ConnectivityState = "online" | "degraded" | "offline";

export const CONNECTIVITY_EVENT = "chinverse-connectivity";

export const emitConnectivityState = (state: ConnectivityState) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(CONNECTIVITY_EVENT, { detail: { state } }));
};

export const connectivityStateFromFailure = () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline" as const;
    return "degraded" as const;
};

export const readConnectivityEvent = (event: Event): ConnectivityState | null => {
    const state = (event as CustomEvent<{ state?: unknown }>).detail?.state;
    return state === "online" || state === "degraded" || state === "offline" ? state : null;
};
