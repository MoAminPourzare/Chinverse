"use client";

import { Suspense, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import NotificationToaster from "@/components/notifications/NotificationToaster";
import RouteTransition from "@/components/layout/RouteTransition";
import ThemeController from "@/components/layout/ThemeController";
import MobileUxController from "@/components/layout/MobileUxController";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import ScrollRestoration from "@/components/layout/ScrollRestoration";
import ForumSupportShortcut from "@/components/layout/ForumSupportShortcut";

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

export default function AppShell({ children, releaseSha }: { children: ReactNode; releaseSha: string }) {
    const pathname = usePathname();
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const showBottomNav = !navHiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    return (
        <PwaProvider releaseSha={releaseSha} showActionCards>
            <div className="app-viewport">
                <div className="app-frame">
                    <ThemeController />
                    <MobileUxController />
                    <NotificationToaster />
                    <div ref={setScrollElement} className={`app-scroll ${showBottomNav ? "pb-24" : ""}`}>
                        <RouteTransition>{children}</RouteTransition>
                    </div>
                    <Suspense fallback={null}><ScrollRestoration scroll={scrollElement} /></Suspense>
                    {showBottomNav && <BottomNav />}
                    <Suspense fallback={null}><ForumSupportShortcut /></Suspense>
                </div>
            </div>
        </PwaProvider>
    );
}
