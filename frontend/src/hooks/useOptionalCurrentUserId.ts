"use client";

import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";

export function useOptionalCurrentUserId() {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !localStorage.getItem("token")) {
            return;
        }

        let cancelled = false;

        void userService.getMe()
            .then((me) => {
                if (!cancelled) {
                    setCurrentUserId(Number(me.id));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCurrentUserId(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return currentUserId;
}
