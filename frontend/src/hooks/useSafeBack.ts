"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { hasInAppBackEntry } from "@/lib/mobileUx";

export const useSafeBack = (fallback = "/") => {
    const router = useRouter();

    return useCallback(() => {
        if (hasInAppBackEntry()) {
            router.back();
            return;
        }
        router.replace(fallback);
    }, [fallback, router]);
};

