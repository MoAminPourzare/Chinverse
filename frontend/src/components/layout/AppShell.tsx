"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headphones } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import NotificationToaster from "@/components/notifications/NotificationToaster";
import RouteTransition from "@/components/layout/RouteTransition";
import ThemeController from "@/components/layout/ThemeController";

const navHiddenPrefixes = [
    "/login",
    "/signup",
    "/verify-account",
    "/forgot-password",
    "/account",
    "/about",
    "/support",
    "/settings",
    "/notifications",
    "/chat",
    "/lessons",
    "/leitner/review",
    "/admin",
    "/legal",
];

export default function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);
    const showBottomNav = !navHiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    const showSupportButton = pathname === "/community";

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [pathname]);

    return (
        <div className="app-viewport">
            <div className="app-frame">
                <ThemeController />
                <NotificationToaster />
                <div ref={scrollRef} className={`app-scroll ${showBottomNav ? "pb-24" : ""}`}>
                    <RouteTransition>{children}</RouteTransition>
                </div>
                {showSupportButton && (
                    <Link
                        href="/support"
                        className="absolute bottom-[calc(env(safe-area-inset-bottom)+92px)] right-5 z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#155aa6] text-white shadow-[0_12px_24px_rgba(21,90,166,0.34)] transition hover:bg-[#0f4e92]"
                        aria-label="پشتیبانی"
                    >
                        <Headphones className="h-6 w-6" />
                    </Link>
                )}
                {showBottomNav && <BottomNav />}
            </div>
        </div>
    );
}
