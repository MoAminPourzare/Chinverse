"use client";

import React, { useState } from "react";
import { X, Volume2 } from "lucide-react";

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

    // Helper to highlight the word in examples
    const highlightWord = (text: string, targetWord: string) => {
        const parts = text.split(targetWord);
        if (parts.length === 1) return text;
        return parts.map((part, i) => (
            <React.Fragment key={i}>
                {part}
                {i < parts.length - 1 && <span className="text-blue-600 font-bold">{targetWord}</span>}
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
            <div className="relative bg-white rounded-t-3xl w-full max-w-md max-h-[70vh] flex flex-col animate-slide-up">
                {/* Header */}
                <div className="p-6 text-center border-b border-gray-100">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>

                    {/* Chinese Character */}
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <h2 className="text-4xl font-bold text-blue-600" dir="ltr">
                            {word.chinese}
                        </h2>
                        <button
                            onClick={playAudio}
                            className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 hover:bg-orange-200 transition-colors"
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
                <div className="flex border-b border-gray-200 px-4" dir="rtl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
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
                <div className="p-4 border-t border-gray-100">
                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform">
                        اضافه کردن به لایتنر
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
