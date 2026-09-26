"use client";

import { BackButton } from "@/components/ui/IconButton";
import { useSafeBack } from "@/hooks/useSafeBack";

interface SafeBackButtonProps {
    fallback?: string;
    label?: string;
    className?: string;
    iconSize?: number;
}

export default function SafeBackButton({
    fallback = "/",
    label,
    className,
    iconSize,
}: SafeBackButtonProps) {
    const goBack = useSafeBack(fallback);
    return <BackButton onClick={goBack} label={label} className={className} iconSize={iconSize} />;
}

