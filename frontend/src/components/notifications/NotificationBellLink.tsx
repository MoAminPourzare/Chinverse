"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { notificationService } from "@/services/notification.service";

export default function NotificationBellLink() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined" || !localStorage.getItem("token")) return;
        let isMounted = true;

        const loadCount = async () => {
            try {
                const unread = await notificationService.getUnreadCount();
                if (isMounted) setCount(unread);
            } catch {
                if (isMounted) setCount(0);
            }
        };

        loadCount();
        const interval = window.setInterval(loadCount, 20_000);
        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, []);

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
