import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    icon?: ReactNode;
    className?: string;
}

export default function SectionHeader({
    title,
    actionLabel,
    actionHref,
    onAction,
    icon,
    className,
}: SectionHeaderProps) {
    const action = actionHref ? (
        <Link
            href={actionHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#155aa6] transition-colors hover:text-[#0f4e92]"
        >
            {actionLabel}
            <ArrowRight size={14} />
        </Link>
    ) : onAction ? (
        <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#155aa6] transition-colors hover:text-[#0f4e92]"
        >
            {actionLabel}
            <ArrowRight size={14} />
        </button>
    ) : null;

    return (
        <div className={cn("flex items-center justify-between gap-4", className)}>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
                </div>
            </div>
            {action}
        </div>
    );
}
