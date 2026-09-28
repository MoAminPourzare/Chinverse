"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Volume2 } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";

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
    image: string;
    border: string;
    header: string;
}> = {
    1: {
        title: "بذر",
        subtitle: "نیازمند یادآوری",
        image: "/assets/chinverse/leitner/stage-seed.svg",
        border: "border-[#e51f35]",
        header: "bg-[#e51f35]",
    },
    2: {
        title: "جوانه",
        subtitle: "حافظه کوتاه مدت",
        image: "/assets/chinverse/leitner/stage-sprout.svg",
        border: "border-[#f4aa16]",
        header: "bg-[#f7bd28]",
    },
    3: {
        title: "نهال",
        subtitle: "حافظه میان مدت",
        image: "/assets/chinverse/leitner/stage-branch.svg",
        border: "border-[#39aa20]",
        header: "bg-[#50b008]",
    },
    4: {
        title: "درخت جوان",
        subtitle: "حافظه بلند مدت",
        image: "/assets/chinverse/leitner/stage-tree.svg",
        border: "border-[#88c7ee]",
        header: "bg-[#a2cef0]",
    },
    5: {
        title: "درخت تنومند",
        subtitle: "آموخته شده",
        image: "/assets/chinverse/leitner/stage-mastered.svg",
        border: "border-[#155aa6]",
        header: "bg-[#20518f]",
    },
};

export default function LeitnerDashboard() {
    const [stats, setStats] = useState<LeitnerStats | null>(null);
    const [dueCards, setDueCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const fetchLeitner = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [statsResponse, reviewResponse] = await Promise.all([
                api.get<LeitnerStats>("/leitner/dashboard"),
                api.get<LeitnerReviewResponse>("/leitner/review", { params: { limit: 1000 } }),
            ]);

            setStats(statsResponse.data);
            setDueCards(Array.isArray(reviewResponse.data.cards) ? reviewResponse.data.cards : []);
        } catch (error) {
            console.error("Failed to fetch leitner dashboard:", error);
            setLoadError("اطلاعات لایتنر دریافت نشد. اتصال را بررسی و دوباره تلاش کن.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchLeitner();
    }, [fetchLeitner]);

    const playAudio = (url?: string) => {
        if (!url) return;
        void new Audio(getMediaUrl(url)).play().catch((error) => {
            console.error("Failed to play vocabulary audio:", error);
        });
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

    if (!stats) {
        return (
            <div className="flex min-h-full flex-col items-center justify-center bg-[#f7f8fa] p-6 text-center" dir="rtl">
                <p className="max-w-xs text-sm font-bold leading-7 text-red-600">
                    {loadError || "اطلاعات لایتنر در دسترس نیست."}
                </p>
                <button
                    type="button"
                    onClick={() => void fetchLeitner()}
                    className="mt-5 rounded-full bg-[#155aa6] px-7 py-3 text-sm font-black text-white"
                >
                    تلاش دوباره
                </button>
            </div>
        );
    }

    const hasCards = stats.total_cards > 0;
    const hasDueCards = dueCards.length > 0;

    return (
        <div className="min-h-full bg-[#f7f8fa] px-4 pb-24 pt-4" dir="rtl">
            <main className="motion-list mx-auto flex w-full max-w-[430px] flex-col gap-4">
                <header className="pt-1 text-center">
                    <h1 className="text-xl font-black text-slate-950">لایتنر</h1>
                </header>

                <section aria-label="جعبه‌های لایتنر">
                    <div className="grid grid-cols-6 gap-2">
                        {[1, 2, 3, 4, 5].map((boxNumber) => (
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
        <section className="flex flex-col items-center px-1 pb-6 pt-2 text-center">
            <Image
                src="/assets/chinverse/leitner/empty-connections.svg"
                alt=""
                width={88}
                height={88}
                className="h-[88px] w-[88px] object-contain"
                unoptimized
            />
            <h2 className="mt-5 text-[16px] font-black leading-7 text-[#434343]">
                هنوز هیچ واژه‌ای به لایتنرت اضافه نکردی!
            </h2>
            <p className="mt-2 max-w-[310px] text-[12px] font-medium leading-[22px] text-[#888888]">
                با لایتنر، هر بار که مرور می‌کنی، اتصال‌های مغزت قوی‌تر می‌شن.
                این یعنی کمتر فراموش می‌کنی، بیشتر توی حافظه‌ات موندگار می‌شن.
                هر وقت واژه‌ای برات چالش‌برانگیز بود، بیارش اینجا تا دیگه هیچ‌وقت فراموشش نکنی!
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
                        disabled={!card.word.audio_url}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-[#155aa6] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-35"
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

function BoxStageCard({ boxNumber, stats }: { boxNumber: number; stats: LeitnerStats }) {
    const box = BOX_INFO[boxNumber];
    const count = stats.box_counts[String(boxNumber)] || 0;

    return (
        <article className={cn(
            "col-span-2 overflow-hidden rounded-[11px] bg-[#d9d9d9]",
            boxNumber === 4 && "col-start-2 row-start-2",
            boxNumber === 5 && "col-start-4 row-start-2",
        )}>
            <div className={cn("flex h-11 flex-col items-center justify-center px-1 text-center text-white", box.header)}>
                <h3 className="text-[12px] font-black leading-[18px]">{box.title}</h3>
                <p className="whitespace-nowrap text-[10px] font-bold leading-[15px]">({box.subtitle})</p>
            </div>
            <div className="relative h-[68px]">
                <div className="absolute bottom-1 right-1 flex h-16 w-16 items-center justify-center">
                    <Image
                        src={box.image}
                        alt=""
                        width={64}
                        height={64}
                        className="h-full w-full object-contain"
                        loading="eager"
                        unoptimized
                    />
                </div>
                <p className="absolute bottom-1.5 left-2 text-[11px] font-bold leading-4 text-[#434343]">
                    {toPersianDigits(count)} لغت
                </p>
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
