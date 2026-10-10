"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { getSafeReturnTo } from "@/lib/returnTo";

export function useCurrentReturnPath() {
    const pathname = usePathname() || "";
    const search = useSearchParams()?.toString() || "";
    return `${pathname}${search ? `?${search}` : ""}`;
}

export function useReturnTo(fallback: string) {
    const path = useCurrentReturnPath();
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return getSafeReturnTo(query, fallback);
}
