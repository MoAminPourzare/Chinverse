"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/components/ui/IconButton";

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
    return <AppHeader title={title} backHref={backHref} onBack={onBack}
        backControl={!backHref && !onBack ? startContent : undefined}
        icon={endContent} className={className} />;
}
