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
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600"
            aria-label="اعلان‌ها"
        >
            <Bell className="h-5 w-5" />
            {count > 0 && (
                <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-lg shadow-rose-500/30">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </Link>
    );
}
