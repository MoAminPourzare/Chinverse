import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface StatCardProps {
    label: string;
    value: string;
    helper?: string;
    icon?: ReactNode;
    accent?: string;
    className?: string;
    inverted?: boolean;
}

export default function StatCard({
    label,
    value,
    helper,
    icon,
    accent = "from-rose-500 to-orange-500",
    className,
    inverted = false,
}: StatCardProps) {
    return (
        <div
            className={cn(
                "rounded-[24px] p-4 backdrop-blur-xl",
                inverted
                    ? "border border-white/10 bg-white/10 text-white"
                    : "border border-white/70 bg-white/85 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.08)]",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", inverted ? "text-white/70" : "text-slate-500")}>
                        {label}
                    </p>
                    <p className={cn("mt-2 text-2xl font-bold tracking-tight", inverted ? "text-white" : "text-slate-900")}>{value}</p>
                    {helper && <p className={cn("mt-1 text-xs leading-5", inverted ? "text-white/65" : "text-slate-500")}>{helper}</p>}
                </div>
                {icon && (
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", accent)}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
