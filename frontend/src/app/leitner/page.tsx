"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    CheckCircle2,
    Clock3,
    Layers,
    Play,
    Sparkles,
    Trophy,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/cn";

interface Word {
    id: number;
    chinese: string;
    pinyin: string;
    persian_meaning?: string;
    audio_url?: string;
}

interface Flashcard {
    id: number;
    box_number: number;
    next_review_at: string;
    word: Word;
}

interface LeitnerStats {
    box_counts: Record<string, number>;
    due_by_box: Record<string, number>;
    box_intervals: Record<string, number>;
    total_cards: number;
    total_due: number;
    upcoming_count: number;
    mastered_count: number;
    next_due_at?: string | null;
    recent_cards: Flashcard[];
}

const BOX_INFO: Record<number, {
    title: string;
    subtitle: string;
    shortLabel: string;
    image: string;
    soft: string;
    border: string;
    header: string;
    body: string;
    accent: string;
}> = {
    1: {
        title: "بذر",
        subtitle: "نیازمند یادآوری",
        shortLabel: "شروع مسیر",
        image: "/assets/chinverse/leitner/stage-seed.svg",
        soft: "bg-[#ffe9ec] text-[#be123c]",
        border: "border-[#f7b7c0]",
        header: "bg-[#e51f35]",
        body: "bg-[#f1f3f7]",
        accent: "text-[#e51f35]",
    },
    2: {
        title: "جوانه",
        subtitle: "حافظه کوتاه‌مدت",
        shortLabel: "تثبیت اولیه",
        image: "/assets/chinverse/leitner/stage-sprout.svg",
        soft: "bg-[#fff3ce] text-[#a16207]",
        border: "border-[#f3ce72]",
        header: "bg-[#f4aa16]",
        body: "bg-[#f1f3f7]",
        accent: "text-[#c47a00]",
    },
    3: {
        title: "نهال",
        subtitle: "حافظه میان‌مدت",
        shortLabel: "رو به رشد",
        soft: "bg-emerald-50 text-emerald-700",
        image: "/assets/chinverse/leitner/stage-branch.svg",
        border: "border-[#9bd88d]",
        header: "bg-[#39aa20]",
        body: "bg-[#f1f3f7]",
        accent: "text-[#238316]",
    },
    4: {
        title: "درخت جوان",
        subtitle: "حافظه بلندمدت",
        shortLabel: "قوی‌تر",
        image: "/assets/chinverse/leitner/stage-tree.svg",
        soft: "bg-[#eef6ff] text-[#155aa6]",
        border: "border-[#8fc1ec]",
        header: "bg-[#88c7ee]",
        body: "bg-[#edf7ff]",
        accent: "text-[#0f4e92]",
    },
    5: {
        title: "درخت تنومند",
        subtitle: "آموخته شده",
        shortLabel: "تقریبا قطعی",
        image: "/assets/chinverse/leitner/stage-mastered.svg",
        soft: "bg-[#e9f2ff] text-[#0f4e92]",
        border: "border-[#9fc2eb]",
        header: "bg-[#155aa6]",
        body: "bg-[#e7eef8]",
        accent: "text-[#155aa6]",
    },
};

function formatReviewTime(value?: string | null) {
    if (!value) return "زمانی ثبت نشده";

    const date = new Date(value);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) return "آماده مرور";
    if (diffDays <= 1) return "فردا";
    return `${toPersianDigits(diffDays)} روز دیگر`;
}

function formatFullDate(value?: string | null) {
    if (!value) return "";
    return new Date(value).toLocaleDateString("fa-IR", { weekday: "long", month: "long", day: "numeric" });
}

export default function LeitnerDashboard() {
    const [stats, setStats] = useState<LeitnerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get<LeitnerStats>("/leitner/dashboard");
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch leitner stats:", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchStats();
    }, []);

    const learnedPercent = useMemo(() => {
        if (!stats?.total_cards) return 0;
        return Math.round((stats.mastered_count / stats.total_cards) * 100);
    }, [stats]);

    const playAudio = (url?: string) => {
        if (!url) return;
        void new Audio(url).play();
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa]" dir="rtl">
                <div className="rounded-[28px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
                        <span>در حال بارگذاری لایتنر...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const hasDueCards = stats.total_due > 0;

    return (
        <div className="min-h-full bg-[#f7f8fa] px-4 pb-24 pt-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
                <header className="pt-1 text-center">
                    <h1 className="text-xl font-black text-slate-950">لایتنر</h1>
                </header>

                <section className="rounded-[28px] border border-slate-100 bg-white/95 p-3 shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((boxNumber) => (
                            <BoxStageCard key={boxNumber} boxNumber={boxNumber} stats={stats} compact />
                        ))}
                    </div>
                    <div className="mx-auto mt-2 grid w-[68%] grid-cols-2 gap-2">
                        {[4, 5].map((boxNumber) => (
                            <BoxStageCard key={boxNumber} boxNumber={boxNumber} stats={stats} />
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-[1fr_auto] items-stretch gap-3">
                    <div className="rounded-[28px] border border-white/80 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.07)]">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[#eef6ff] text-[#155aa6]">
                                <Clock3 size={22} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-400">نوبت مرور بعدی</p>
                                <h2 className="mt-1 text-sm font-black leading-6 text-slate-950">
                                    {hasDueCards
                                        ? `${toPersianDigits(stats.total_due)} کارت آماده است`
                                        : `${formatReviewTime(stats.next_due_at)} ${stats.next_due_at ? `، ${formatFullDate(stats.next_due_at)}` : ""}`}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/leitner/review"
                        className={cn(
                            "flex w-[112px] flex-col items-center justify-center gap-2 rounded-[28px] bg-[#155aa6] px-3 text-center text-sm font-black text-white shadow-[0_16px_32px_rgba(21,90,166,0.26)] transition hover:bg-[#0f4e92] active:scale-[0.98]",
                            !hasDueCards && "bg-slate-300 text-slate-600 hover:bg-slate-300",
                        )}
                    >
                        <Play size={20} fill="currentColor" />
                        {hasDueCards ? "شروع مرور" : "فعلا خالی"}
                    </Link>
                </section>

                <section className="grid grid-cols-3 gap-2">
                    <MiniStat icon={<Layers size={16} />} label="همه کارت‌ها" value={stats.total_cards} />
                    <MiniStat icon={<Trophy size={16} />} label="قطعی‌ترها" value={stats.mastered_count} />
                    <MiniStat icon={<Sparkles size={16} />} label="پیش رو" value={stats.upcoming_count} />
                </section>

                <section className="rounded-[28px] border border-white/80 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.07)]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={23} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-sm font-black text-slate-900">پیشرفت حافظه بلندمدت</h2>
                                <span className="text-lg font-black text-[#155aa6]">{toPersianDigits(learnedPercent)}٪</span>
                            </div>
                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-l from-[#155aa6] via-[#4f9de8] to-[#50bca4]"
                                    style={{ width: `${stats.total_cards ? Math.max(4, learnedPercent) : 0}%` }}
                                />
                            </div>
                            <p className="mt-3 text-[11px] font-medium leading-6 text-slate-500">
                                جعبه پنجم یعنی لغت تقریبا تثبیت شده و فقط برای تازه ماندن حافظه مرور می‌شود.
                            </p>
                        </div>
                    </div>
                </section>

                {stats.recent_cards.length > 0 && (
                    <section className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-base font-black text-slate-950">لغت‌های اخیر</h2>
                            <span className="text-[11px] font-bold text-slate-400">مرورهای نزدیک</span>
                        </div>

                        {stats.recent_cards.map((card) => {
                            const boxNumber = normalizeBoxNumber(card.box_number);
                            const box = BOX_INFO[boxNumber];

                            return (
                                <article
                                    key={card.id}
                                    className={cn(
                                        "overflow-hidden rounded-[24px] border bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]",
                                        box.border,
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3 p-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => playAudio(card.word.audio_url)}
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[#eef6ff] transition hover:bg-[#dbeafe]"
                                                aria-label="پخش تلفظ"
                                            >
                                                <Image
                                                    src="/assets/chinverse/icons/Speaker.svg"
                                                    alt=""
                                                    width={22}
                                                    height={22}
                                                    className="h-5 w-5 object-contain"
                                                    unoptimized
                                                />
                                            </button>
                                            <div className="min-w-0">
                                                <p className="font-cjk truncate text-xl font-bold text-slate-900" dir="ltr" lang="zh-CN">
                                                    {card.word.chinese}
                                                </p>
                                                <p className="font-latin truncate text-xs font-semibold text-slate-400" dir="ltr">
                                                    {card.word.pinyin}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn("flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black", box.soft)}>
                                            <Image
                                                src={box.image}
                                                alt=""
                                                width={16}
                                                height={16}
                                                className="h-4 w-4 object-contain"
                                                unoptimized
                                            />
                                            جعبه {toPersianDigits(boxNumber)}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-3 py-2 text-[11px] font-bold text-slate-500">
                                        <span className="line-clamp-1">{card.word.persian_meaning || box.shortLabel}</span>
                                        <span className="shrink-0">بعدی: {formatReviewTime(card.next_review_at)}</span>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>
        </div>
    );
}

function BoxStageCard({ boxNumber, stats, compact = false }: { boxNumber: number; stats: LeitnerStats; compact?: boolean }) {
    const box = BOX_INFO[boxNumber];
    const count = stats.box_counts[String(boxNumber)] || 0;
    const dueCount = stats.due_by_box[String(boxNumber)] || 0;
    const interval = stats.box_intervals[String(boxNumber)] || 1;

    return (
        <article className={cn("overflow-hidden rounded-[16px] border bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]", box.border)}>
            <div className={cn("flex h-[42px] flex-col items-center justify-center px-1 text-center text-white", box.header)}>
                <h3 className="line-clamp-1 text-[12px] font-black leading-4">{box.title}</h3>
                <p className="line-clamp-1 text-[8.5px] font-bold leading-3 text-white/88">{box.subtitle}</p>
            </div>
            <div className={cn("flex flex-col items-center px-2 pb-2 pt-1.5 text-center", compact ? "min-h-[104px]" : "min-h-[114px]", box.body)}>
                <div className={cn("relative flex items-center justify-center", compact ? "h-12 w-12" : "h-14 w-14")}>
                    <Image
                        src={box.image}
                        alt=""
                        width={compact ? 58 : 68}
                        height={compact ? 58 : 68}
                        className="h-full w-full object-contain drop-shadow-sm"
                        unoptimized
                    />
                </div>
                <div className="mt-auto w-full space-y-1">
                    <p className={cn("line-clamp-1 text-[9px] font-black", box.accent)}>{box.shortLabel}</p>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-700">
                        <span>{toPersianDigits(count)} لغت</span>
                        <span className={cn("h-1.5 w-1.5 rounded-full", box.header)} />
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[8.5px] font-bold text-slate-500">
                        <span>{toPersianDigits(dueCount)} مرور</span>
                        <span>هر {toPersianDigits(interval)} روز</span>
                    </div>
                </div>
            </div>
        </article>
    );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <div className="rounded-[24px] border border-white/80 bg-white px-3 py-3 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[16px] bg-[#eef6ff] text-[#155aa6]">
                {icon}
            </div>
            <p className="mt-2 text-[10px] font-bold text-slate-500">{label}</p>
            <p className="text-lg font-black text-slate-900">{toPersianDigits(value)}</p>
        </div>
    );
}

function normalizeBoxNumber(value: number) {
    return Math.max(1, Math.min(5, value || 1));
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
