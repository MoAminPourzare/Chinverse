"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { hasInAppBackEntry, resolveSafeBackAction } from "@/lib/mobileUx";

export const useSafeBack = (fallback = "/") => {
    const router = useRouter();

    return useCallback(() => {
        const action = resolveSafeBackAction(
            hasInAppBackEntry(),
            fallback,
            window.location.origin,
        );
        if (action.kind === "back") {
            router.back();
            return;
        }
        router.replace(action.href);
    }, [fallback, router]);
};
