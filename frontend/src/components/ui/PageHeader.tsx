"use client";

import type { ReactNode } from "react";
import Surface from "@/components/ui/Surface";
import { BackButton } from "@/components/ui/IconButton";
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
    backHref,
    onBack,
    startContent,
    endContent,
    className,
}: PageHeaderProps) {
    const backControl = onBack ? (
        <BackButton onClick={onBack} />
    ) : backHref ? (
        <BackButton href={backHref} />
    ) : (
        startContent
    );

    return (
        <Surface
            as="header"
            className={cn("sticky top-3 z-40 rounded-[28px] px-4 py-3", className)}
        >
            <div className="relative flex min-h-10 items-center justify-center">
                {backControl && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        {backControl}
                    </div>
                )}
                <div className="min-w-0 px-14 text-center">
                    <h1 className="truncate text-base font-black tracking-tight text-slate-950">
                        {title}
                    </h1>
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    {endContent ?? <div className="h-10 w-10" />}
                </div>
            </div>
        </Surface>
    );
}
