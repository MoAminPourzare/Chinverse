import Link from "next/link";
import { Play } from "lucide-react";

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
    badge,
}: LessonCardProps) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-[20px] border border-[#dfe6f0] bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:border-[#155aa6]/30 hover:bg-[#eef6ff]"
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#155aa6] text-base font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.20)]">
                {index}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h4 className="truncate text-sm font-black text-slate-900">{title}</h4>
                        {subtitle && <p className="mt-1 truncate text-xs font-medium text-slate-500">{subtitle}</p>}
                    </div>
                    {badge && (
                        <span className="rounded-full bg-[#eef6ff] px-2 py-1 text-[10px] font-black text-[#155aa6]">
                            {badge}
                        </span>
                    )}
                </div>
                {summary && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{summary}</p>}
                {durationLabel && <p className="mt-1 text-[11px] font-bold text-slate-400">{durationLabel}</p>}
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-[#155aa6] transition group-hover:bg-[#155aa6] group-hover:text-white">
                <Play size={16} className="mr-0.5 fill-current" />
            </div>
        </Link>
    );
}
