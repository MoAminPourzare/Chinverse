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
        <div className="w-full max-w-md bg-white h-dvh max-h-dvh relative shadow-2xl overflow-hidden flex flex-col">
            <div className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide ${showBottomNav ? "pb-20" : ""}`}>
                {children}
            </div>
            {showBottomNav && <BottomNav />}
        </div>
    );
}
