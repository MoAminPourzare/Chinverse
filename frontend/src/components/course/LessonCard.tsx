import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/cn";

interface LessonCardProps {
    href: string;
    index: number;
    title: string;
    subtitle?: string;
    summary?: string;
    durationLabel?: string;
    accentClass?: string;
    badge?: string;
}

export default function LessonCard({
    href,
    index,
    title,
    subtitle,
    summary,
    durationLabel,
    accentClass = "from-rose-500 to-orange-500",
    badge,
}: LessonCardProps) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
        >
            <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg", accentClass)}>
                {index}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-slate-900">{title}</h4>
                        {subtitle && <p className="mt-1 truncate text-xs text-slate-500">{subtitle}</p>}
                    </div>
                    {badge && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                            {badge}
                        </span>
                    )}
                </div>
                {summary && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{summary}</p>}
                {durationLabel && <p className="mt-2 text-[11px] font-medium text-slate-400">{durationLabel}</p>}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-rose-50 group-hover:text-rose-600">
                <Play size={18} className="mr-0.5 fill-current" />
            </div>
        </Link>
    );
}
