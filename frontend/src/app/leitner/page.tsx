"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, ArrowRight } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import api from "@/lib/api";

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
    total_due: number;
    recent_cards: Flashcard[];
}

const BOX_COLORS: Record<number, string> = {
    1: "bg-red-500", // Seed
    2: "bg-orange-500", // Sprout
    3: "bg-green-500", // Sapling
    4: "bg-blue-500", // Tree
    5: "bg-blue-800", // Mature Tree
};

const BOX_NAMES: Record<number, { title: string; subtitle: string, icon: string }> = {
    1: { title: "بذر", subtitle: "(نیازمند یادآوری)", icon: "🌱" },
    2: { title: "جوانه", subtitle: "(حافظه کوتاه مدت)", icon: "🌿" },
    3: { title: "نهال", subtitle: "(حافظه میان مدت)", icon: "🪴" },
    4: { title: "درخت جوان", subtitle: "(حافظه بلند مدت)", icon: "🌳" },
    5: { title: "درخت تنومند", subtitle: "(آموخته شده)", icon: "🌲" },
};

export default function LeitnerDashboard() {
    const [stats, setStats] = useState<LeitnerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get("/leitner/dashboard");
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch leitner stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-20">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-white pb-24" dir="rtl">
            {/* Header */}
            <header className="px-6 pt-8 pb-4">
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">لایتنر</h1>
            </header>

            <main className="px-6 space-y-8">
                {/* Boxes Grid */}
                <div className="grid grid-cols-6 gap-2">
                    {/* Top Row: 1, 2, 3 */}
                    <div className="col-span-2 relative aspect-[0.9] bg-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className={`h-8 ${BOX_COLORS[1]} flex items-center justify-center`}>
                            <span className="text-white text-[10px] font-bold">{BOX_NAMES[1].title}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-xs text-blue-100 bg-red-500/10 rounded px-1 mb-1 hidden">{BOX_NAMES[1].subtitle}</span>
                            <span className="text-3xl mb-1">{BOX_NAMES[1].icon}</span>
                            <span className="text-sm font-bold text-gray-700">{stats.box_counts[1] || 0} لغت</span>
                        </div>
                    </div>
                    <div className="col-span-2 relative aspect-[0.9] bg-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className={`h-8 ${BOX_COLORS[2]} flex items-center justify-center`}>
                            <span className="text-white text-[10px] font-bold">{BOX_NAMES[2].title}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-3xl mb-1">{BOX_NAMES[2].icon}</span>
                            <span className="text-sm font-bold text-gray-700">{stats.box_counts[2] || 0} لغت</span>
                        </div>
                    </div>
                    <div className="col-span-2 relative aspect-[0.9] bg-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className={`h-8 ${BOX_COLORS[3]} flex items-center justify-center`}>
                            <span className="text-white text-[10px] font-bold">{BOX_NAMES[3].title}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-3xl mb-1">{BOX_NAMES[3].icon}</span>
                            <span className="text-sm font-bold text-gray-700">{stats.box_counts[3] || 0} لغت</span>
                        </div>
                    </div>

                    {/* Bottom Row: 4, 5 (Centered) */}
                    <div className="col-span-3 relative aspect-[1.1] bg-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col max-w-[140px] mx-auto w-full">
                        <div className={`h-8 ${BOX_COLORS[4]} flex items-center justify-center`}>
                            <span className="text-white text-[10px] font-bold">{BOX_NAMES[4].title}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-4xl mb-1">{BOX_NAMES[4].icon}</span>
                            <span className="text-sm font-bold text-gray-700">{stats.box_counts[4] || 0} لغت</span>
                        </div>
                    </div>
                    <div className="col-span-3 relative aspect-[1.1] bg-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col max-w-[140px] mx-auto w-full">
                        <div className={`h-8 ${BOX_COLORS[5]} flex items-center justify-center`}>
                            <span className="text-white text-[10px] font-bold">{BOX_NAMES[5].title}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-4xl mb-1 ">{BOX_NAMES[5].icon}</span>
                            <span className="text-sm font-bold text-gray-700">{stats.box_counts[5] || 0} لغت</span>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {Object.values(stats.box_counts).every(c => c === 0) && (
                    <div className="mt-12 text-center space-y-4">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                {/* Simple network icon visualization using divs/svgs */}
                                <Brain size={64} className="text-blue-300 mx-auto" strokeWidth={1} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">هنوز هیچ واژه‌ای به لایتنر اضافه نکردی!</h3>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                            با لایتنر، هر بار که مرور می‌کنی، اتصال‌های مغزت قوی‌تر می‌شن.
                            این یعنی کم‌کم واژه‌ها برای همیشه توی حافظه‌ت موندگار می‌شن.
                        </p>
                    </div>
                )}

                {/* Review Button */}
                {stats.total_due > 0 && (
                    <Link href="/leitner/review" className="block w-full">
                        <button className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-700/20 active:scale-[0.98] transition-transform">
                            شروع مرور لغات
                        </button>
                    </Link>
                )}

                {/* Recent List */}
                {stats.recent_cards.length > 0 && (
                    <div className="space-y-3">
                        {stats.recent_cards.map((card) => (
                            <div key={card.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">{BOX_NAMES[card.box_number].icon}</div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-lg mb-1" dir="ltr">{card.word.chinese}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button className="text-gray-400">
                                        <ArrowRight size={20} className="rotate-180" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </main>
            <BottomNav />
        </div>
    );
}
