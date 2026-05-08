"use client";

import React, { useState, useEffect } from "react";
import { X, Volume2, Check } from "lucide-react";
import api from "@/lib/api";

interface VocabularyWord {
    id: number;
    chinese: string;
    pinyin: string;
    audio_url?: string;
    persian_meaning?: string;
    chinese_meaning?: string;
    composition?: string;
    examples: Array<{
        id: number;
        zh_text: string;
        pinyin: string;
        target_text: string;
    }>;
}

interface VocabularyModalProps {
    word: VocabularyWord;
    isOpen: boolean;
    onClose: () => void;
}

type TabType = "chinese" | "persian" | "composition" | "examples";

export default function VocabularyModal({ word, isOpen, onClose }: VocabularyModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("chinese");
    const [isInLeitner, setIsInLeitner] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Check if word is already in Leitner when modal opens
    useEffect(() => {
        if (isOpen && word.id !== undefined && word.id !== null) {
            const checkLeitner = async () => {
                try {
                    const response = await api.get(`/leitner/check/${word.id}`);
                    setIsInLeitner(response.data.in_leitner);
                } catch (error) {
                    console.error("Failed to check leitner status:", error);
                }
            };
            checkLeitner();
        }
    }, [isOpen, word.id]);

    if (!isOpen) return null;

    const tabs: { key: TabType; label: string }[] = [
        { key: "chinese", label: "معنی چینی" },
        { key: "persian", label: "معنی فارسی" },
        { key: "composition", label: "ترکیب واژگانی" },
        { key: "examples", label: "مثال‌ها" },
    ];

    const playAudio = () => {
        if (word.audio_url) {
            const audio = new Audio(word.audio_url);
            audio.play();
        }
    };

    const handleAddToLeitner = async () => {
        if (word.id === undefined || word.id === null || isInLeitner || isAdding) return;
        setIsAdding(true);
        try {
            await api.post("/leitner/add", {
                word_id: word.id,
                chinese: word.chinese,
                pinyin: word.pinyin,
                persian_meaning: word.persian_meaning,
                chinese_meaning: word.chinese_meaning
            });
            setIsInLeitner(true);
        } catch (error) {
            console.error("Failed to add to leitner:", error);
        } finally {
            setIsAdding(false);
        }
    };

    // Helper to highlight the word in examples
    const highlightWord = (text: string, targetWord: string) => {
        const parts = text.split(targetWord);
        if (parts.length === 1) return text;
        return parts.map((part, i) => (
            <React.Fragment key={i}>
                {part}
                {i < parts.length - 1 && <span className="font-bold text-rose-600">{targetWord}</span>}
            </React.Fragment>
        ));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative flex max-h-[70vh] w-full max-w-md animate-slide-up flex-col rounded-t-[30px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
                {/* Header */}
                <div className="border-b border-slate-100 p-6 text-center">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                            className="absolute right-4 top-4 rounded-2xl p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={24} />
                    </button>

                    {/* Chinese Character */}
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <h2 className="text-4xl font-bold text-rose-600" dir="ltr">
                            {word.chinese}
                        </h2>
                        <button
                            onClick={playAudio}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-500 transition-colors hover:bg-orange-200"
                        >
                            <Volume2 size={20} />
                        </button>
                    </div>

                    {/* Pinyin */}
                    <p className="text-lg text-gray-600" dir="ltr">
                        {word.pinyin}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-4" dir="rtl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                                ? "text-rose-600 border-b-2 border-rose-600"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6" dir="rtl">
                    {activeTab === "chinese" && (
                        <div className="space-y-3">
                            {word.chinese_meaning?.split("\n").map((line, i) => (
                                <p key={i} className="text-gray-800" dir="ltr">
                                    {i + 1}. {line}
                                </p>
                            ))}
                            {!word.chinese_meaning && (
                                <p className="text-gray-400 text-center">معنی چینی موجود نیست</p>
                            )}
                        </div>
                    )}

                    {activeTab === "persian" && (
                        <div className="space-y-3">
                            {word.persian_meaning?.split("\n").map((line, i) => (
                                <p key={i} className="text-gray-800">
                                    {i + 1}. {line}
                                </p>
                            ))}
                            {!word.persian_meaning && (
                                <p className="text-gray-400 text-center">معنی فارسی موجود نیست</p>
                            )}
                        </div>
                    )}

                    {activeTab === "composition" && (
                        <div className="space-y-3">
                            {word.composition?.split("\n").map((line, i) => (
                                <p key={i} className="text-gray-800" dir="ltr">
                                    {i + 1}. {highlightWord(line, word.chinese)}
                                </p>
                            ))}
                            {!word.composition && (
                                <p className="text-gray-400 text-center">ترکیب واژگانی موجود نیست</p>
                            )}
                        </div>
                    )}

                    {activeTab === "examples" && (
                        <div className="space-y-4">
                            {word.examples.map((example, i) => (
                                <div key={example.id} className="space-y-1">
                                    <p className="text-gray-800" dir="ltr">
                                        {i + 1}. {highlightWord(example.zh_text, word.chinese)}
                                    </p>
                                </div>
                            ))}
                            {word.examples.length === 0 && (
                                <p className="text-gray-400 text-center">مثالی موجود نیست</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Button */}
                <div className="border-t border-slate-100 p-4">
                    <button
                        onClick={handleAddToLeitner}
                        disabled={isInLeitner || isAdding}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${isInLeitner
                            ? "bg-green-500 text-white cursor-default"
                            : isAdding
                                ? "bg-gray-400 text-white cursor-wait"
                                : "bg-gradient-to-r from-rose-500 to-orange-500 text-white active:scale-[0.98] hover:from-rose-600 hover:to-orange-600"
                            }`}
                    >
                        {isInLeitner ? (
                            <>
                                <Check size={20} />
                                اضافه شد
                            </>
                        ) : isAdding ? (
                            "در حال افزودن..."
                        ) : (
                            "اضافه کردن به لایتنر"
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
