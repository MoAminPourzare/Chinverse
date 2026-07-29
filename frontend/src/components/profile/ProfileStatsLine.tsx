"use client";

import Link from "next/link";
import { MapPin, UsersRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { getDirectionalTextProps } from "@/lib/textDirection";

interface ProfileStatsLineProps {
    followersCount: number;
    location?: string;
    followersHref?: string;
    className?: string;
    followersClassName?: string;
}

export default function ProfileStatsLine({
    followersCount,
    location,
    followersHref,
    className,
    followersClassName,
}: ProfileStatsLineProps) {
    const cleanLocation = location?.trim();
    const followersContent = (
        <>
            <UsersRound className="h-4 w-4 shrink-0" />
            <span className="font-latin text-sm font-bold leading-none">{followersCount}</span>
        </>
    );

    return (
        <div dir="rtl" className={cn("flex flex-wrap items-center justify-center gap-2 text-[12px] font-medium", className)}>
            {cleanLocation && (
                <>
                    <span dir="rtl" className="inline-flex min-w-0 items-center gap-1">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate" {...getDirectionalTextProps(cleanLocation)}>{cleanLocation}</span>
                    </span>
                    <span className="opacity-40">|</span>
                </>
            )}

            {followersHref ? (
                <Link href={followersHref} className={cn("inline-flex items-center gap-1 text-inherit", followersClassName)}>
                    {followersContent}
                </Link>
            ) : (
                <span className={cn("inline-flex items-center gap-1", followersClassName)}>
                    {followersContent}
                </span>
            )}
        </div>
    );
}
