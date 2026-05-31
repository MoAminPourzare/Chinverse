"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import NotificationToaster from "@/components/notifications/NotificationToaster";
import RouteTransition from "@/components/layout/RouteTransition";

const navHiddenPrefixes = [
    "/login",
    "/signup",
    "/account",
    "/about",
    "/support",
    "/settings",
    "/notifications",
    "/chat",
    "/watch",
    "/lessons",
    "/leitner/review",
    "/admin",
];

export default function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);
    const showBottomNav = !navHiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [pathname]);

    return (
        <div className="app-viewport">
            <div className="app-frame">
                <NotificationToaster />
                <div ref={scrollRef} className={`app-scroll ${showBottomNav ? "pb-24" : ""}`}>
                    <RouteTransition>{children}</RouteTransition>
                </div>
                {showBottomNav && <BottomNav />}
            </div>
        </div>
    );
}
