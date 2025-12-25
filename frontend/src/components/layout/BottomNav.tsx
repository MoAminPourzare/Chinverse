"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, Users, Brain } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: "خانه", href: "/", icon: Home },
        { name: "کاوش", href: "/explore", icon: Compass },
        { name: "ویترین", href: "/showcase", icon: Users },
        { name: "لایتنر", href: "/leitner", icon: Brain },
        { name: "پروفایل", href: "/profile", icon: User },
    ];

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area padding for mobile devices */}
            <div className="h-safe-bottom bg-white" />
        </div>
    );
}
