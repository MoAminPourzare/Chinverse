"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";

const navHiddenPrefixes = [
    "/login",
    "/signup",
    "/landing",
    "/account",
    "/about",
    "/support",
    "/settings",
    "/notifications",
    "/chat",
    "/watch",
    "/lessons",
    "/leitner/review",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const showBottomNav = !navHiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    return (
        <div className="app-viewport">
            <div className="app-frame">
                <div className={`app-scroll ${showBottomNav ? "pb-24" : ""}`}>
                    {children}
                </div>
                {showBottomNav && <BottomNav />}
            </div>
        </div>
    );
}
