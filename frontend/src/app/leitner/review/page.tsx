"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { Check, Loader2, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { cn } from "@/lib/cn";
import { BackButton } from "@/components/ui/IconButton";
import {
    getChineseTextStyle,
    getHighlightStyle,
    getPersianTextStyle,
    useLearningPreferences,
} from "@/lib/learningPreferences";

interface Example {
    id?: number;
    type?: "video" | "text";
    url?: string;
    poster?: string;
    zh_text?: string;
    sentence_ch?: string;
    sentence_fa?: string;
    target_text?: string;
    pinyin?: string;
}

interface Word {
    id: number;
    chinese: string;
    pinyin: string;
    audio_url?: string;
    persian_meaning?: string;
    chinese_meaning?: string;
    composition?: string;
    examples?: Example[];
}

interface Flashcard {
    id: number;
    box_number: number;
    next_review_at: string;
    word: Word;
}

const BOX_STYLES: Record<number, { label: string; border: string; text: string; soft: string }> = {
    1: { label: "جعبه ۱", border: "border-red-500", text: "text-red-600", soft: "bg-red-50 text-red-600" },
    2: { label: "جعبه ۲", border: "border-amber-500", text: "text-amber-700", soft: "bg-amber-50 text-amber-700" },
    3: { label: "جعبه ۳", border: "border-emerald-500", text: "text-emerald-700", soft: "bg-emerald-50 text-emerald-700" },
    4: { label: "جعبه ۴", border: "border-sky-500", text: "text-sky-700", soft: "bg-sky-50 text-sky-700" },
    5: { label: "جعبه ۵", border: "border-[#155aa6]", text: "text-[#155aa6]", soft: "bg-[#eef6ff] text-[#155aa6]" },
};

const BOX_INTERVALS: Record<number, number> = {
    1: 1,
    2: 3,
    3: 7,
    4: 15,
    5: 30,
};

type BackTabType = "examples" | "composition" | "persian" | "chinese";

const backTabs: { key: BackTabType; label: string }[] = [
    { key: "examples", label: "مثال‌ها" },
    { key: "composition", label: "ترکیب" },
    { key: "persian", label: "معنی فارسی" },
    { key: "chinese", label: "معنی چینی" },
];

export default function LeitnerReviewPage() {
    const router = useRouter();
    const { preferences } = useLearningPreferences();
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [activeBackTab, setActiveBackTab] = useState<BackTabType>("examples");

    useEffect(() => {
        const fetchReviewCards = async () => {
            try {
                const response = await api.get("/leitner/review");
                setCards(response.data.cards);
                if (response.data.cards.length === 0) {
                    setSessionComplete(true);
                }
            } catch (error) {
                console.error("Failed to fetch review cards:", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchReviewCards();
    }, []);

    const playAudio = (url?: string) => {
        if (!url) return;
        void new Audio(url).play();
    };

    const handleReview = async (remembered: boolean) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const currentCard = cards[currentIndex];

        try {
            await api.post("/leitner/review", {
                card_id: currentCard.id,
                remembered,
            });

            if (currentIndex + 1 < cards.length) {
                setCurrentIndex(currentIndex + 1);
                setIsFlipped(false);
                setActiveBackTab("examples");
            } else {
                setSessionComplete(true);
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const highlightKeyword = (text: string, keyword: string) => {
        if (!text || !keyword) return text;
        const parts = text.split(keyword);
        if (parts.length === 1) return text;
        return parts.map((part, i) => (
            <span key={`${part}-${i}`}>
                {part}
                {i < parts.length - 1 && (
                    <span
                        className="font-cjk px-1 font-bold"
                        style={getHighlightStyle(preferences.leitnerHighlightColor)}
                        lang="zh-CN"
                    >
                        {keyword}
                    </span>
                )}
            </span>
        ));
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#155aa6]" />
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="flex min-h-full flex-col items-center justify-center bg-[#f7f8fa] p-6 text-center" dir="rtl">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#eef6ff]">
                    <Image
                        src="/assets/chinverse/icons/Laitner.svg"
                        alt=""
                        width={54}
                        height={54}
                        className="h-14 w-14 object-contain"
                        unoptimized
                    />
                </div>
                <h2 className="mb-2 text-2xl font-black text-slate-950">آفرین! مرور امروز تمام شد</h2>
                <p className="mb-8 max-w-xs text-sm leading-7 text-slate-500">
                    برای امروز کارتی برای مرور نداری. وقتی زمان مرور بعدی برسد، کارت‌ها دوباره اینجا می‌آیند.
                </p>
                <button
                    onClick={() => router.push("/leitner")}
                    className="rounded-full bg-[#155aa6] px-8 py-3 text-base font-black text-white shadow-[0_10px_18px_rgba(21,90,166,0.28)] transition hover:bg-[#0f4e92]"
                >
                    بازگشت به لایتنر
                </button>
            </div>
        );
    }

    const currentCard = cards[currentIndex];
    const currentBox = normalizeBoxNumber(currentCard.box_number);
    const boxStyle = BOX_STYLES[currentBox];
    const rememberedBox = Math.min(currentBox + 1, 5);
    const rememberedInterval = BOX_INTERVALS[rememberedBox] || 1;
    const chineseTextStyle = getChineseTextStyle(preferences);
    const persianTextStyle = getPersianTextStyle(preferences);

    const examples: Example[] = currentCard.word.examples || [
        {
            type: "text",
            sentence_ch: `${currentCard.word.chinese}，我今天要好好练习。`,
            sentence_fa: "امروز می‌خواهم این واژه را خوب تمرین کنم.",
        },
        {
            type: "text",
            sentence_ch: `他想学习${currentCard.word.chinese}这个词。`,
            sentence_fa: "او می‌خواهد این واژه را یاد بگیرد.",
        },
    ];

    return (
        <div className="min-h-full bg-[#f7f8fa] px-4 pb-24 pt-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col">
                <header className="grid grid-cols-[72px_1fr_40px] items-center gap-3">
                    <BackButton onClick={() => router.push("/leitner")} className="justify-self-end" />
                    <h1 className="text-center text-lg font-black text-slate-950">مرور لغات</h1>
                    <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#155aa6] shadow-sm">
                        {toPersianDigits(currentIndex + 1)} / {toPersianDigits(cards.length)}
                    </div>
                </header>

                <section className="mt-4 rounded-[10px] bg-[#eef6ff] px-4 py-3 text-center">
                    <p className="text-xs font-black text-[#155aa6]">
                        {boxStyle.label} · اگر بلد باشی: {BOX_STYLES[rememberedBox].label}، مرور {toPersianDigits(rememberedInterval)} روز بعد
                    </p>
                    <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">
                        اول معنی را از حافظه بگو، بعد پشت کارت را ببین.
                    </p>
                </section>

                <section className={cn("mt-4 overflow-hidden rounded-[18px] border-2 bg-white shadow-[0_12px_26px_rgba(15,23,42,0.10)]", boxStyle.border)}>
                    {!isFlipped ? (
                        <div className="flex min-h-[340px] flex-col items-center justify-center px-6 py-8 text-center">
                            <span className={cn("rounded-full px-3 py-1 text-[11px] font-black", boxStyle.soft)}>
                                {boxStyle.label}
                            </span>
                            <div className="mt-8 flex items-center justify-center gap-4">
                                <span className="font-cjk text-[3.4rem] font-bold leading-tight text-slate-900" dir="ltr" lang="zh-CN">
                                    {currentCard.word.chinese}
                                </span>
                                <button
                                    onClick={() => playAudio(currentCard.word.audio_url)}
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6ff] text-[#155aa6] transition hover:bg-[#dbeafe]"
                                    aria-label="پخش تلفظ"
                                >
                                    <Image
                                        src="/assets/chinverse/icons/Speaker.svg"
                                        alt=""
                                        width={23}
                                        height={23}
                                        className="h-6 w-6 object-contain"
                                        unoptimized
                                    />
                                </button>
                            </div>
                            {preferences.showPinyin && (
                                <p className="font-latin mt-3 text-sm font-bold text-slate-400" dir="ltr">
                                    {currentCard.word.pinyin}
                                </p>
                            )}
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="mt-10 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#155aa6] text-sm font-black text-white shadow-[0_10px_18px_rgba(21,90,166,0.25)] transition active:scale-[0.98]"
                            >
                                دیدن پشت کارت
                                <Send size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex max-h-[620px] flex-col">
                            <div className="border-b border-slate-100 bg-[#f8fafc] px-4 py-4 text-center">
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => playAudio(currentCard.word.audio_url)}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#155aa6] shadow-sm"
                                        aria-label="پخش تلفظ"
                                    >
                                        <Image
                                            src="/assets/chinverse/icons/Speaker.svg"
                                            alt=""
                                            width={18}
                                            height={18}
                                            className="h-5 w-5 object-contain"
                                            unoptimized
                                        />
                                    </button>
                                    <span className={cn("font-cjk text-3xl font-black", boxStyle.text)} dir="ltr" lang="zh-CN">
                                        {currentCard.word.chinese}
                                    </span>
                                </div>
                                {preferences.showPinyin && (
                                    <p className="font-latin mt-1 text-sm font-bold text-slate-400" dir="ltr">
                                        {currentCard.word.pinyin}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 py-2" dir="rtl">
                                {backTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveBackTab(tab.key)}
                                        className={cn(
                                            "shrink-0 rounded-full px-3 py-2 text-xs font-black transition",
                                            activeBackTab === tab.key
                                                ? "bg-[#155aa6] text-white"
                                                : "bg-slate-100 text-slate-500 hover:bg-[#eef6ff] hover:text-[#155aa6]",
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[220px] flex-1 overflow-y-auto px-4 py-4" dir="rtl">
                                {activeBackTab === "examples" && (
                                    <div className="space-y-4">
                                        {examples.length === 0 ? (
                                            <EmptyText>مثالی موجود نیست</EmptyText>
                                        ) : (
                                            examples.map((example, i) => (
                                                <div key={i} className="rounded-[14px] bg-slate-50 p-3">
                                                    {example.type === "video" && example.url && (
                                                        <video
                                                            src={example.url}
                                                            poster={example.poster}
                                                            controls
                                                            className="mb-3 aspect-video w-full rounded-xl bg-black"
                                                        />
                                                    )}
                                                    <p className="font-cjk text-slate-900" style={chineseTextStyle} dir="ltr" lang="zh-CN">
                                                        {toPersianDigits(i + 1)}. {highlightKeyword(example.sentence_ch || example.zh_text || "", currentCard.word.chinese)}
                                                    </p>
                                                    {(example.sentence_fa || example.target_text) && (
                                                        <p className="mt-2 text-slate-500" style={persianTextStyle}>
                                                            {example.sentence_fa || example.target_text}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeBackTab === "composition" && (
                                    <TextLines
                                        value={currentCard.word.composition}
                                        empty="ترکیب واژگانی موجود نیست"
                                        chinese
                                        keyword={currentCard.word.chinese}
                                        style={chineseTextStyle}
                                        highlight={highlightKeyword}
                                    />
                                )}

                                {activeBackTab === "persian" && (
                                    <TextLines
                                        value={currentCard.word.persian_meaning}
                                        empty="معنی فارسی موجود نیست"
                                        style={persianTextStyle}
                                    />
                                )}

                                {activeBackTab === "chinese" && (
                                    <TextLines
                                        value={currentCard.word.chinese_meaning}
                                        empty="معنی چینی موجود نیست"
                                        chinese
                                        style={chineseTextStyle}
                                    />
                                )}
                            </div>

                            <div className="border-t border-slate-100 bg-white p-4">
                                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                                    <div className="rounded-[12px] bg-red-50 px-3 py-2 text-red-600">
                                        فراموش شد: جعبه ۱، مرور فردا
                                    </div>
                                    <div className="rounded-[12px] bg-emerald-50 px-3 py-2 text-emerald-700">
                                        بلد بودی: {BOX_STYLES[rememberedBox].label}، {toPersianDigits(rememberedInterval)} روز بعد
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-3">
                                    <button
                                        onClick={() => handleReview(false)}
                                        disabled={isSubmitting}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 py-3 text-sm font-black text-white transition active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <X size={18} />
                                        یادم نیست
                                    </button>
                                    <button
                                        onClick={() => handleReview(true)}
                                        disabled={isSubmitting}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 text-sm font-black text-white transition active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <Check size={18} />
                                        یادم هست
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <div className="mt-4 flex justify-center gap-1.5">
                    {cards.map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                "h-2 rounded-full transition-all",
                                i === currentIndex ? "w-5 bg-[#155aa6]" : i < currentIndex ? "w-2 bg-emerald-400" : "w-2 bg-slate-300",
                            )}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}

function TextLines({
    value,
    empty,
    chinese = false,
    keyword = "",
    style,
    highlight,
}: {
    value?: string;
    empty: string;
    chinese?: boolean;
    keyword?: string;
    style: CSSProperties;
    highlight?: (text: string, keyword: string) => ReactNode;
}) {
    if (!value) return <EmptyText>{empty}</EmptyText>;

    return (
        <div className="space-y-3">
            {value.split("\n").map((line, i) => (
                <p
                    key={`${line}-${i}`}
                    className={cn("rounded-[14px] bg-slate-50 p-3 text-slate-800", chinese && "font-cjk")}
                    style={style}
                    dir={chinese ? "ltr" : "rtl"}
                    lang={chinese ? "zh-CN" : "fa"}
                >
                    {toPersianDigits(i + 1)}. {highlight && keyword ? highlight(line, keyword) : line}
                </p>
            ))}
        </div>
    );
}

function EmptyText({ children }: { children: ReactNode }) {
    return (
        <p className="rounded-[14px] bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">
            {children}
        </p>
    );
}

function normalizeBoxNumber(value: number) {
    return Math.max(1, Math.min(5, value || 1));
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
