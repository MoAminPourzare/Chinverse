"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Volume2 } from "lucide-react";
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

interface LeitnerReviewResponse {
    cards: Flashcard[];
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
        border: "border-[#e51f35]",
        header: "bg-[#e51f35]",
        body: "bg-[#f1f3f7]",
        accent: "text-[#e51f35]",
    },
    2: {
        title: "جوانه",
        subtitle: "حافظه کوتاه مدت",
        shortLabel: "تثبیت اولیه",
        image: "/assets/chinverse/leitner/stage-sprout.svg",
        soft: "bg-[#fff3ce] text-[#a16207]",
        border: "border-[#f4aa16]",
        header: "bg-[#f4aa16]",
        body: "bg-[#f1f3f7]",
        accent: "text-[#c47a00]",
    },
    3: {
        title: "نهال",
        subtitle: "حافظه میان مدت",
        shortLabel: "رو به رشد",
        image: "/assets/chinverse/leitner/stage-branch.svg",
        soft: "bg-emerald-50 text-emerald-700",
        border: "border-[#39aa20]",
        header: "bg-[#39aa20]",
        body: "bg-[#f1f3f7]",
        accent: "text-[#238316]",
    },
    4: {
        title: "درخت جوان",
        subtitle: "حافظه بلند مدت",
        shortLabel: "قوی تر",
        image: "/assets/chinverse/leitner/stage-tree.svg",
        soft: "bg-[#eef6ff] text-[#155aa6]",
        border: "border-[#88c7ee]",
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
        border: "border-[#155aa6]",
        header: "bg-[#155aa6]",
        body: "bg-[#e7eef8]",
        accent: "text-[#155aa6]",
    },
};

export default function LeitnerDashboard() {
    const [stats, setStats] = useState<LeitnerStats | null>(null);
    const [dueCards, setDueCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchLeitner = async () => {
            try {
                const [statsResponse, reviewResponse] = await Promise.all([
                    api.get<LeitnerStats>("/leitner/dashboard"),
                    api.get<LeitnerReviewResponse>("/leitner/review"),
                ]);

                if (!cancelled) {
                    setStats(statsResponse.data);
                    setDueCards(reviewResponse.data.cards || []);
                }
            } catch (error) {
                console.error("Failed to fetch leitner dashboard:", error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void fetchLeitner();

        return () => {
            cancelled = true;
        };
    }, []);

    const playAudio = (url?: string) => {
        if (!url) return;
        void new Audio(url).play();
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa]" dir="rtl">
                <div className="flex items-center gap-3 rounded-[28px] bg-white px-5 py-4 text-sm font-bold text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
                    <span>در حال بارگذاری لایتنر…</span>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const hasCards = stats.total_cards > 0;
    const hasDueCards = dueCards.length > 0;

    return (
        <div className="min-h-full bg-[#f7f8fa] px-4 pb-24 pt-4" dir="rtl">
            <main className="motion-list mx-auto flex w-full max-w-[430px] flex-col gap-4">
                <header className="pt-1 text-center">
                    <h1 className="text-xl font-black text-slate-950">لایتنر</h1>
                </header>

                <section className="px-1">
                    <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((boxNumber) => (
                            <BoxStageCard key={boxNumber} boxNumber={boxNumber} stats={stats} compact />
                        ))}
                    </div>
                    <div className="mx-auto mt-1.5 grid w-[68%] grid-cols-2 gap-1.5">
                        {[4, 5].map((boxNumber) => (
                            <BoxStageCard key={boxNumber} boxNumber={boxNumber} stats={stats} />
                        ))}
                    </div>
                </section>

                {!hasCards ? (
                    <EmptyLeitnerState />
                ) : (
                    <section className="space-y-4">
                        {hasDueCards ? (
                            <Link
                                href="/leitner/review"
                                className="flex h-14 items-center justify-center gap-2 rounded-full bg-[#155aa6] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(21,90,166,0.32)] transition hover:-translate-y-0.5 hover:bg-[#0f4e92]"
                            >
                                <Play size={18} fill="currentColor" />
                                شروع مرور لغات
                            </Link>
                        ) : (
                            <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-center text-sm font-black text-slate-500 shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
                                فعلا لغتی برای مرور آماده نیست.
                            </div>
                        )}

                        {hasDueCards && (
                            <div className="motion-list space-y-2.5">
                                {dueCards.map((card) => (
                                    <ReviewWordRow key={card.id} card={card} onPlayAudio={playAudio} />
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}

function EmptyLeitnerState() {
    return (
        <section className="flex min-h-[360px] flex-col items-center justify-center px-6 pb-8 pt-10 text-center">
            <Image
                src="/assets/chinverse/icons/Hub Connection.svg"
                alt=""
                width={88}
                height={88}
                className="h-20 w-20 object-contain"
                unoptimized
            />
            <h2 className="mt-7 text-[18px] font-black leading-8 text-[#25272d]">
                هنوز هیچ واژه‌ای به لایتنرت اضافه نکردی!
            </h2>
            <p className="mt-3 max-w-[310px] text-[12px] font-medium leading-7 text-[#888e99]">
                با دیدن درس‌ها، هر واژه‌ای که برایت تازه یا مهم بود به لایتنر بفرست. اینجا همان واژه‌ها برای مرور منظم و ماندگار آماده می‌شوند.
            </p>
        </section>
    );
}

function ReviewWordRow({ card, onPlayAudio }: { card: Flashcard; onPlayAudio: (url?: string) => void }) {
    const boxNumber = normalizeBoxNumber(card.box_number);
    const box = BOX_INFO[boxNumber];

    return (
        <article className={cn("overflow-hidden rounded-[14px] border-2 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]", box.border)}>
            <div className="flex min-h-[58px] items-center justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onPlayAudio(card.word.audio_url)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-[#155aa6] transition hover:bg-[#dbeafe]"
                        aria-label="پخش تلفظ"
                    >
                        <Volume2 size={19} />
                    </button>
                    <Image
                        src={box.image}
                        alt=""
                        width={34}
                        height={34}
                        className="h-9 w-9 shrink-0 object-contain"
                        unoptimized
                    />
                </div>

                <div className="min-w-0 flex-1 text-left" dir="ltr">
                    <p className="font-cjk truncate text-[19px] font-bold text-slate-900" lang="zh-CN">
                        {card.word.chinese}
                    </p>
                    <p className="font-latin truncate text-[11px] font-semibold text-slate-400">
                        {card.word.pinyin}
                    </p>
                </div>
            </div>
            {card.word.persian_meaning && (
                <div className="border-t border-slate-100 bg-slate-50/75 px-3 py-2 text-right text-[11px] font-bold leading-5 text-slate-500">
                    {card.word.persian_meaning}
                </div>
            )}
        </article>
    );
}

function BoxStageCard({ boxNumber, stats, compact = false }: { boxNumber: number; stats: LeitnerStats; compact?: boolean }) {
    const box = BOX_INFO[boxNumber];
    const count = stats.box_counts[String(boxNumber)] || 0;
    const interval = stats.box_intervals[String(boxNumber)] || 1;

    return (
        <article className="overflow-hidden rounded-[9px] bg-[#d5d6da] shadow-sm">
            <div className={cn("flex h-[34px] flex-col items-center justify-center px-1 text-center text-white", box.header)}>
                <h3 className="line-clamp-1 text-[11px] font-black leading-4">{box.title}</h3>
                <p className="line-clamp-1 text-[8px] font-bold leading-3 text-white/95">{box.subtitle}</p>
            </div>
            <div className={cn("flex flex-col items-center px-2 pb-2 pt-1.5 text-center", compact ? "min-h-[96px]" : "min-h-[106px]", box.body)}>
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
                <div className="mt-auto w-full">
                    <p className={cn("line-clamp-1 text-[8.5px] font-black", box.accent)}>{box.shortLabel}</p>
                    <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-700">
                        <span>{toPersianDigits(count)} لغت</span>
                        <span className={cn("h-1.5 w-1.5 rounded-full", box.header)} />
                    </div>
                    <p className="mt-0.5 text-[8.5px] font-bold text-slate-500">{toPersianDigits(interval)} روز</p>
                </div>
            </div>
        </article>
    );
}

function normalizeBoxNumber(value: number) {
    return Math.max(1, Math.min(5, value || 1));
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
