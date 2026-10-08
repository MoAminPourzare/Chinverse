"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogDescription, DialogPanel, DialogTitle } from "@headlessui/react";
import { Play, Trash2, Volume2 } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/cn";
import { LEITNER_STAGES } from "@/lib/leitnerStages";
import { useVocabularyPronunciation } from "@/hooks/useVocabularyPronunciation";

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

const BOX_INFO = LEITNER_STAGES;

export default function LeitnerDashboard() {
    const [stats, setStats] = useState<LeitnerStats | null>(null);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fetchLeitner = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [statsResponse, cardsResponse] = await Promise.all([
                api.get<LeitnerStats>("/leitner/dashboard"),
                api.get<LeitnerReviewResponse>("/leitner/cards", { params: { limit: 1000 } }),
            ]);
            const nextCards = [...cardsResponse.data.cards];
            // Include cards scheduled for later, and paginate large personal collections.
            while (nextCards.length < statsResponse.data.total_cards) {
                const response = await api.get<LeitnerReviewResponse>("/leitner/cards", { params: { limit: 1000, skip: nextCards.length } });
                if (!response.data.cards.length) break;
                nextCards.push(...response.data.cards);
            }
            setStats(statsResponse.data);
            setCards(nextCards);
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

    const deleteCard = async () => {
        if (!cardToDelete || deleting) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            await api.delete(`/leitner/cards/${cardToDelete.id}`);
            setCards((previous) => previous.filter((card) => card.id !== cardToDelete.id));
            setCardToDelete(null);
            await fetchLeitner();
        } catch {
            setDeleteError("لغت حذف نشد. دوباره تلاش کن.");
        } finally {
            setDeleting(false);
        }
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
    const hasDueCards = stats.total_due > 0;

    return (
        <div className="min-h-full bg-[#f7f8fa] px-4 pb-24 pt-4" dir="rtl">
            <main className="motion-list mx-auto flex w-full max-w-[430px] flex-col gap-4">
                <header className="pt-1 text-center">
                    <h1 className="text-xl font-black text-slate-950">لایتنر</h1>
                </header>

                {loadError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{loadError} <button type="button" onClick={() => void fetchLeitner()} className="underline">تلاش دوباره</button></div>}

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

                        {cards.length > 0 && (
                            <div className="motion-list space-y-2.5">
                                {cards.map((card) => (
                                    <ReviewWordRow key={card.id} card={card} onDelete={() => { setDeleteError(null); setCardToDelete(card); }} />
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>
            <Dialog open={Boolean(cardToDelete)} onClose={() => { if (!deleting) setCardToDelete(null); }} className="relative z-[1100]" dir="rtl">
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-5">
                    <DialogPanel className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
                        <DialogTitle className="text-lg font-black text-slate-950">حذف لغت از لایتنر</DialogTitle>
                        <DialogDescription className="mt-4 text-sm leading-7 text-slate-600">آیا مطمئنی که می‌خوای این لغت رو از لایتنرت حذف کنی؟</DialogDescription>
                        <div className="font-cjk mt-3 text-center text-2xl text-slate-900" lang="zh-CN" dir="ltr">{cardToDelete?.word.chinese}</div>
                        {deleteError && <p role="alert" className="mt-3 text-sm text-red-700">{deleteError}</p>}
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => void deleteCard()} disabled={deleting} className="min-h-12 rounded-full bg-red-700 font-bold text-white disabled:opacity-60">آره</button>
                            <button type="button" data-autofocus onClick={() => setCardToDelete(null)} disabled={deleting} className="min-h-12 rounded-full bg-slate-100 font-bold text-slate-700 disabled:opacity-60">نه</button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}

function EmptyLeitnerState() {
    return (
        <section className="flex flex-col items-center px-1 pb-6 pt-8 text-center">
            <Image
                src="/assets/chinverse/leitner/empty-connections.svg"
                alt=""
                width={112}
                height={112}
                className="h-28 w-28 object-contain"
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

function ReviewWordRow({ card, onDelete }: { card: Flashcard; onDelete: () => void }) {
    const boxNumber = normalizeBoxNumber(card.box_number);
    const box = BOX_INFO[boxNumber];
    const pronunciation = useVocabularyPronunciation(card.word, true);

    return (
        <article className={cn("overflow-hidden rounded-[14px] border-2 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]", box.border)}>
            <div className="grid min-h-[68px] grid-cols-[76px_minmax(0,1fr)_76px] items-center gap-1 px-2 py-2">
                <div className="flex min-w-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={() => pronunciation.playing ? pronunciation.stop() : void pronunciation.play()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-[#155aa6] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={pronunciation.playing ? "توقف تلفظ" : "پخش تلفظ"}
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

                <div className="min-w-0 text-center" dir="ltr">
                    <p className="font-cjk break-words text-center! text-[23px] font-bold text-slate-900" lang="zh-CN">
                        {card.word.chinese}
                    </p>
                </div>
                <button type="button" onClick={onDelete} aria-label={`حذف ${card.word.chinese} از لایتنر`} className="flex h-11 w-11 items-center justify-center justify-self-end rounded-full text-slate-500 transition hover:bg-red-50 hover:text-red-700"><Trash2 size={20} /></button>
            </div>
            {pronunciation.error && <p role="alert" className="px-3 pb-2 text-xs leading-6 text-red-700">{pronunciation.error}</p>}
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
