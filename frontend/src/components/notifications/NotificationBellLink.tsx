"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Bell } from "lucide-react";
import { notificationService } from "@/services/notification.service";
import { authService } from "@/services/auth.service";
import { useAdaptivePolling } from "@/hooks/useAdaptivePolling";

export default function NotificationBellLink() {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);

    useAdaptivePolling({
        task: async (signal) => {
            if (!await authService.restoreSession()) {
                const changed = countRef.current !== 0;
                countRef.current = 0;
                setCount(0);
                return changed;
            }

            const unread = await notificationService.getUnreadCount(signal);
            const changed = unread !== countRef.current;
            countRef.current = unread;
            setCount(unread);
            return changed;
        },
        baseIntervalMs: 20_000,
        maxIntervalMs: 90_000,
    });

    return (
        <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#242833] transition hover:bg-white"
            aria-label="اعلان‌ها"
        >
            <Bell className="h-5 w-5" strokeWidth={1.9} />
            {count > 0 && (
                <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#155aa6] px-1 text-[10px] font-black text-white shadow-lg shadow-[#155aa6]/30">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </Link>
    );
}
