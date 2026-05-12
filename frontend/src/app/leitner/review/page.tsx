"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Volume2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
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

const BOX_BORDER_COLORS: Record<number, string> = {
    1: "border-red-500",
    2: "border-orange-500",
    3: "border-green-500",
    4: "border-blue-500",
    5: "border-blue-800",
};

const BOX_LABELS: Record<number, string> = {
    1: "جعبه ۱",
    2: "جعبه ۲",
    3: "جعبه ۳",
    4: "جعبه ۴",
    5: "جعبه ۵",
};

const BOX_INTERVALS: Record<number, number> = {
    1: 1,
    2: 3,
    3: 7,
    4: 15,
    5: 30,
};

type BackTabType = "examples" | "composition" | "persian" | "chinese";

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

        fetchReviewCards();
    }, []);

    const playAudio = (url?: string) => {
        if (url) {
            const audio = new Audio(url);
            audio.play();
        }
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

            // Move to next card
            if (currentIndex + 1 < cards.length) {
                setCurrentIndex(currentIndex + 1);
                setIsFlipped(false);
                setActiveBackTab("examples"); // Reset tab for next card
            } else {
                setSessionComplete(true);
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to highlight keywords in blue
    const highlightKeyword = (text: string, keyword: string) => {
        if (!text || !keyword) return text;
        const parts = text.split(keyword);
        if (parts.length === 1) return text;
        return parts.map((part, i) => (
            <React.Fragment key={i}>
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
            </React.Fragment>
        ));
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
            </div>
        );
    }

    // Session Complete Screen
    if (sessionComplete) {
        return (
            <div className="flex min-h-full flex-col items-center justify-center p-6 text-center" dir="rtl">
                <div className="font-cjk mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-rose-50 to-amber-50 text-2xl font-black text-rose-500" lang="zh-CN">完</div>
                <h2 className="mb-2 text-2xl font-black text-slate-950">آفرین! همه کارت‌ها مرور شدند!</h2>
                <p className="mb-8 text-slate-500">برای امروز کارتی برای مرور نداری. فردا دوباره بیا!</p>
                <button
                    onClick={() => router.push("/leitner")}
                    className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-8 py-3 text-lg font-bold text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition hover:from-rose-600 hover:to-orange-600"
                >
                    بازگشت به لایتنر
                </button>
            </div>
        );
    }

    const currentCard = cards[currentIndex];
    const borderColor = BOX_BORDER_COLORS[currentCard.box_number] || "border-red-500";
    const rememberedBox = Math.min(currentCard.box_number + 1, 5);
    const rememberedInterval = BOX_INTERVALS[rememberedBox] || 1;
    const chineseTextStyle = getChineseTextStyle(preferences);
    const persianTextStyle = getPersianTextStyle(preferences);

    const backTabs: { key: BackTabType; label: string }[] = [
        { key: "examples", label: "مثال‌ها" },
        { key: "composition", label: "ترکیب واژگانی" },
        { key: "persian", label: "معنی فارسی" },
        { key: "chinese", label: "معنی چینی" },
    ];

    // Mock examples if not present
    const examples: Example[] = currentCard.word.examples || [
        {
            type: "video",
            url: "https://www.w3schools.com/html/mov_bbb.mp4",
            sentence_ch: `${currentCard.word.chinese}，我不是在求你...`,
            sentence_fa: "مدیر، من از شما خواهش نمی‌کنم...",
        },
        {
            type: "text",
            sentence_ch: `他想当${currentCard.word.chinese}`,
            sentence_fa: "او می‌خواهد مدیر شود.",
        },
    ];

    return (
        <div className="flex min-h-full flex-col px-4 pb-5 pt-4" dir="rtl">
            {/* Header */}
            <header className="sticky top-3 z-50 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600">
                    <ArrowLeft size={24} className="rotate-180" />
                </button>
                <h1 className="text-lg font-black text-slate-950">مرور لغات</h1>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500">
                    {currentIndex + 1} / {cards.length}
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center space-y-4 overflow-hidden pt-5">
                {/* Intro Text */}
                <div className="text-center space-y-1">
                    <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                        <span>{BOX_LABELS[currentCard.box_number]}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>اگر بلد باشی: {BOX_LABELS[rememberedBox]}، مرور {rememberedInterval.toLocaleString("fa-IR")} روز بعد</span>
                    </div>
                    <p className="text-sm font-medium text-slate-600">اول معنی را از حافظه بگو، بعد پشت کارت را ببین.</p>
                </div>

                {/* Card Container */}
                <div className={`flex w-full max-w-md flex-1 flex-col overflow-hidden rounded-[30px] border-2 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl ${borderColor}`}>

                    {!isFlipped ? (
                        /* Front Side */
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="flex items-center justify-center gap-4">
                                <span className="font-cjk text-[2.75rem] font-bold leading-tight text-gray-800 sm:text-5xl" dir="ltr" lang="zh-CN">
                                    {currentCard.word.chinese}
                                </span>
                                <button
                                    onClick={() => playAudio(currentCard.word.audio_url)}
                                    className="text-rose-500 transition-colors hover:text-rose-600"
                                >
                                    <Volume2 size={32} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Back Side with Tabs */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header: Character + Pinyin */}
                            <div className="flex items-center justify-center gap-3 border-b border-slate-100 bg-slate-50 p-4">
                                <button
                                    onClick={() => playAudio(currentCard.word.audio_url)}
                                    className="text-orange-500 hover:text-orange-600"
                                >
                                    <Volume2 size={20} />
                                </button>
                                <span className="font-cjk text-3xl font-bold text-rose-600" dir="ltr" lang="zh-CN">
                                    {currentCard.word.chinese}
                                </span>
                            </div>
                            {preferences.showPinyin && (
                                <p className="font-latin py-2 text-center text-base text-gray-500" dir="ltr" lang="en">
                                    {currentCard.word.pinyin}
                                </p>
                            )}

                            {/* Tab Bar */}
                            <div className="flex border-b border-slate-200 px-2" dir="rtl">
                                {backTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveBackTab(tab.key)}
                                        className={`flex-1 py-2 text-xs font-medium transition-colors ${activeBackTab === tab.key
                                            ? "text-rose-600 border-b-2 border-rose-600"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-4" dir="rtl">
                                {activeBackTab === "examples" && (
                                    <div className="space-y-4">
                                        {examples.length === 0 ? (
                                            <p className="text-gray-400 text-center">مثالی موجود نیست</p>
                                        ) : (
                                            examples.map((example, i) => (
                                                <div key={i} className="space-y-2">
                                                    {example.type === "video" && example.url && (
                                                        <video
                                                            src={example.url}
                                                            poster={example.poster}
                                                            controls
                                                            className="w-full rounded-xl aspect-video bg-black"
                                                        />
                                                    )}
                                                    <p className="font-cjk text-gray-800" style={chineseTextStyle} dir="ltr" lang="zh-CN">
                                                        {i + 1}. {highlightKeyword(example.sentence_ch || example.zh_text || "", currentCard.word.chinese)}
                                                    </p>
                                                    {(example.sentence_fa || example.target_text) && (
                                                        <p className="text-gray-500" style={persianTextStyle}>
                                                            {example.sentence_fa || example.target_text}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeBackTab === "composition" && (
                                    <div className="space-y-3">
                                        {currentCard.word.composition ? (
                                            currentCard.word.composition.split("\n").map((line, i) => (
                                                <p key={i} className="font-cjk text-gray-800" style={chineseTextStyle} dir="ltr" lang="zh-CN">
                                                    {i + 1}. {highlightKeyword(line, currentCard.word.chinese)}
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-gray-400 text-center">ترکیب واژگانی موجود نیست</p>
                                        )}
                                    </div>
                                )}

                                {activeBackTab === "persian" && (
                                    <div className="space-y-3">
                                        {currentCard.word.persian_meaning ? (
                                            currentCard.word.persian_meaning.split("\n").map((line, i) => (
                                                <p key={i} className="text-gray-800" style={persianTextStyle}>
                                                    {i + 1}. {line}
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-gray-400 text-center">معنی فارسی موجود نیست</p>
                                        )}
                                    </div>
                                )}

                                {activeBackTab === "chinese" && (
                                    <div className="space-y-3">
                                        {currentCard.word.chinese_meaning ? (
                                            currentCard.word.chinese_meaning.split("\n").map((line, i) => (
                                                <p key={i} className="font-cjk text-gray-800" style={chineseTextStyle} dir="ltr" lang="zh-CN">
                                                    {i + 1}. {line}
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-gray-400 text-center">معنی چینی موجود نیست</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Button(s) - Fixed at bottom */}
                    <div className="border-t border-slate-100 bg-white p-4">
                        {!isFlipped ? (
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 text-lg font-bold text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition active:scale-[0.98]"
                            >
                                دیدن پشت کارت
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                                    <div className="rounded-2xl bg-red-50 px-3 py-2 text-red-600">
                                        فراموش شد: جعبه ۱، مرور فردا
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
                                        بلد بودی: {BOX_LABELS[rememberedBox]}، {rememberedInterval.toLocaleString("fa-IR")} روز بعد
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleReview(false)}
                                        disabled={isSubmitting}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <X size={18} />
                                        یادم نیست
                                    </button>
                                    <button
                                        onClick={() => handleReview(true)}
                                        disabled={isSubmitting}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <Check size={18} />
                                        یادم هست
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex gap-1">
                    {cards.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all ${i === currentIndex
                                ? "w-4 bg-orange-400"
                                : i < currentIndex
                                    ? "w-2 bg-green-400"
                                    : "w-2 bg-gray-300"
                                }`}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}
