import { cn } from "@/lib/cn";

interface ProgressBarProps {
    value: number;
    label?: string;
    helper?: string;
    className?: string;
}

export default function ProgressBar({ value, label, helper, className }: ProgressBarProps) {
    const safeValue = Math.max(0, Math.min(100, value));

    return (
        <div className={cn("space-y-2", className)}>
            {(label || helper) && (
                <div className="flex items-center justify-between gap-3 text-xs">
                    {label ? <span className="font-semibold text-slate-700">{label}</span> : <span />}
                    {helper && <span className="text-slate-500">{helper}</span>}
                </div>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[#155aa6] via-[#50bca4] to-[#ffb74d] transition-all duration-500"
                    style={{ width: `${safeValue}%` }}
                />
            </div>
        </div>
    );
}
