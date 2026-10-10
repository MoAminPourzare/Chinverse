"use client";

import { useSyncExternalStore } from "react";
import { getSafeReturnTo } from "@/lib/returnTo";

function subscribe(callback: () => void) {
    window.addEventListener("popstate", callback);
    window.addEventListener("chinverse:navigation", callback);
    return () => {
        window.removeEventListener("popstate", callback);
        window.removeEventListener("chinverse:navigation", callback);
    };
}

const snapshot = () => `${window.location.pathname}${window.location.search}`;
const serverSnapshot = () => "";

export function useCurrentReturnPath() {
    return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function useReturnTo(fallback: string) {
    const path = useCurrentReturnPath();
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return getSafeReturnTo(query, fallback);
}
