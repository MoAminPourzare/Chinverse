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
    subtitle,
    actionLabel,
    actionHref,
    onAction,
    icon,
    className,
}: SectionHeaderProps) {
    const action = actionHref ? (
        <Link
            href={actionHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition-colors hover:text-rose-700"
        >
            {actionLabel}
            <ArrowRight size={14} />
        </Link>
    ) : onAction ? (
        <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition-colors hover:text-rose-700"
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
                {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}
