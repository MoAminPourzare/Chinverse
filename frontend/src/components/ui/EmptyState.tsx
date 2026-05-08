import type { ReactNode } from "react";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <Surface className={cn("px-6 py-10 text-center", className)}>
            {icon && (
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-rose-50 to-amber-50 text-rose-500">
                    {icon}
                </div>
            )}
            <h2 className="text-base font-bold text-slate-950">{title}</h2>
            {description && (
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </Surface>
    );
}
