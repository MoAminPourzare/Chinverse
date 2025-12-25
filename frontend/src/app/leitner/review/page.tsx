"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Volume2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

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
    word: Word;
}

const BOX_BORDER_COLORS: Record<number, string> = {
    1: "border-red-500",
    2: "border-orange-500",
    3: "border-green-500",
    4: "border-blue-500",
    5: "border-blue-800",
};

type BackTabType = "examples" | "composition" | "persian" | "chinese";

export default function LeitnerReviewPage() {
    const router = useRouter();
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
                {i < parts.length - 1 && <span className="text-blue-600 font-bold">{keyword}</span>}
            </React.Fragment>
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    // Session Complete Screen
    if (sessionComplete) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center" dir="rtl">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">آفرین! همه کارت‌ها مرور شدند!</h2>
                <p className="text-gray-500 mb-8">برای امروز کارتی برای مرور نداری. فردا دوباره بیا!</p>
                <button
                    onClick={() => router.push("/leitner")}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
                >
                    بازگشت به لایتنر
                </button>
            </div>
        );
    }

    const currentCard = cards[currentIndex];
    const borderColor = BOX_BORDER_COLORS[currentCard.box_number] || "border-red-500";

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
        <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between bg-white shadow-sm">
                <button onClick={() => router.back()} className="text-gray-600">
                    <ArrowLeft size={24} className="rotate-180" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">مرور لغات</h1>
                <div className="text-sm text-gray-500">
                    {currentIndex + 1} / {cards.length}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center p-4 space-y-4 overflow-hidden">
                {/* Intro Text */}
                <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-700">الان ممکنه فراموش کنی، اما یادت باشه تکرار امروز،</p>
                    <p className="text-sm font-medium text-gray-700">حافظه فردات رو می‌سازه.</p>
                    <div className="flex justify-center mt-1">
                        <span className="text-xl">🌱</span>
                    </div>
                </div>

                {/* Card Container */}
                <div className={`w-full max-w-sm flex-1 bg-white rounded-2xl shadow-lg border-2 ${borderColor} flex flex-col overflow-hidden`}>

                    {!isFlipped ? (
                        /* Front Side */
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-5xl font-bold text-gray-800" dir="ltr">
                                    {currentCard.word.chinese}
                                </span>
                                <button
                                    onClick={() => playAudio(currentCard.word.audio_url)}
                                    className="text-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    <Volume2 size={32} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Back Side with Tabs */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header: Character + Pinyin */}
                            <div className="flex items-center justify-center gap-3 p-4 border-b border-gray-100 bg-gray-50">
                                <button
                                    onClick={() => playAudio(currentCard.word.audio_url)}
                                    className="text-orange-500 hover:text-orange-600"
                                >
                                    <Volume2 size={20} />
                                </button>
                                <span className="text-3xl font-bold text-blue-600" dir="ltr">
                                    {currentCard.word.chinese}
                                </span>
                            </div>
                            <p className="text-base text-gray-500 text-center py-2" dir="ltr">
                                {currentCard.word.pinyin}
                            </p>

                            {/* Tab Bar */}
                            <div className="flex border-b border-gray-200 px-2" dir="rtl">
                                {backTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveBackTab(tab.key)}
                                        className={`flex-1 py-2 text-xs font-medium transition-colors ${activeBackTab === tab.key
                                            ? "text-blue-600 border-b-2 border-blue-600"
                                            : "text-gray-500 hover:text-gray-700"
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
                                                    <p className="text-gray-800 text-base" dir="ltr">
                                                        {i + 1}. {highlightKeyword(example.sentence_ch || example.zh_text || "", currentCard.word.chinese)}
                                                    </p>
                                                    {(example.sentence_fa || example.target_text) && (
                                                        <p className="text-gray-500 text-sm">
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
                                                <p key={i} className="text-gray-800" dir="ltr">
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
                                                <p key={i} className="text-gray-800">
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
                                                <p key={i} className="text-gray-800" dir="ltr">
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
                    <div className="p-4 border-t border-gray-100 bg-white">
                        {!isFlipped ? (
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="w-full bg-blue-800 text-white py-3 rounded-full font-bold text-lg shadow-md active:scale-[0.98] transition-transform"
                            >
                                دیدن پشت کارت
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleReview(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-red-500 text-white py-3 rounded-full font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                                >
                                    <X size={18} />
                                    یادم نیست
                                </button>
                                <button
                                    onClick={() => handleReview(true)}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-green-500 text-white py-3 rounded-full font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
                                >
                                    <Check size={18} />
                                    یادم هست
                                </button>
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
