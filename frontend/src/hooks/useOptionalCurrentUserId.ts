"use client";

import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";

export function useOptionalCurrentUserId() {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        void authService.restoreSession()
            .then(async (authenticated) => {
                if (!authenticated) return null;
                return userService.getMe();
            })
            .then((me) => {
                if (!cancelled) {
                    setCurrentUserId(me ? Number(me.id) : null);
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
