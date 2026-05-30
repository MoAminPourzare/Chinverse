"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Compass, Home, User, Users } from "lucide-react";
import { cn } from "@/lib/cn";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: "خانه", href: "/", icon: Home },
        { name: "لایتنر", href: "/leitner", icon: Brain },
        { name: "کاوش", href: "/explore", icon: Compass },
        { name: "ویترین", href: "/showcase", icon: Users },
        { name: "پروفایل", href: "/profile", icon: User },
    ];

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 px-3 pb-3">
            <div className="bottom-nav-shell pointer-events-auto mx-auto max-w-xl rounded-[28px] border border-white/70 bg-white/92 px-2 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                <div className="flex items-end justify-around gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                data-active={isActive ? "true" : "false"}
                                className={cn(
                                    "bottom-nav-link relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center",
                                    isActive
                                        ? "bg-gradient-to-b from-[#eef6ff] to-white text-[#155aa6] shadow-sm"
                                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-700",
                                )}
                            >
                                <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-semibold leading-none">{item.name}</span>
                                {isActive && <span className="bottom-nav-dot absolute top-1 h-1 w-1 rounded-full bg-[#155aa6]" />}
                            </Link>
                        );
                    })}
                </div>
            </div>
            <div className="h-safe-bottom" />
        </div>
    );
}
