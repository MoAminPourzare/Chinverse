"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    onBack?: () => void;
    startContent?: ReactNode;
    endContent?: ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    subtitle,
    backHref,
    onBack,
    startContent,
    endContent,
    className,
}: PageHeaderProps) {
    const backButton = onBack ? (
        <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-600 shadow-sm transition hover:bg-white hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label="بازگشت"
        >
            <ArrowRight size={19} />
        </button>
    ) : backHref ? (
        <Link
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-600 shadow-sm transition hover:bg-white hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            aria-label="بازگشت"
        >
            <ArrowRight size={19} />
        </Link>
    ) : startContent ? (
        startContent
    ) : (
        <div className="h-10 w-10" />
    );

    return (
        <Surface
            as="header"
            className={cn("sticky top-3 z-40 mx-4 rounded-[24px] px-4 py-3", className)}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {backButton}
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {endContent ?? <div className="h-10 w-10" />}
            </div>
        </Surface>
    );
}
