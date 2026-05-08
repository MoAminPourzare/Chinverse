"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import api from "@/lib/api";
import Surface from "@/components/ui/Surface";
import SectionHeader from "@/components/ui/SectionHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";

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
    1: "from-rose-500 to-orange-500",
    2: "from-amber-500 to-orange-500",
    3: "from-emerald-500 to-teal-500",
    4: "from-sky-500 to-blue-600",
    5: "from-indigo-600 to-slate-900",
};

const BOX_NAMES: Record<number, { title: string; subtitle: string; icon: string }> = {
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
            <div className="flex min-h-full items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                    <span>در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const boxCountEntries = Object.entries(stats.box_counts);

    return (
        <div className="min-h-full px-4 py-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
                <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#334155_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
                    <div className="grid gap-5 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/80">
                                Leitner
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight">مرور واژه‌ها با ساختار روشن‌تر</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                                کارت‌ها را به‌صورت منظم مرور کن و ببین هر واژه در کدام جعبه قرار دارد.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">واژه‌های آماده</p>
                                <p className="mt-2 text-2xl font-bold text-white">{stats.total_due}</p>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">جعبه‌ها</p>
                                <p className="mt-2 text-2xl font-bold text-white">{boxCountEntries.length}</p>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">وضعیت</p>
                                <p className="mt-2 text-2xl font-bold text-white">فعال</p>
                            </div>
                        </div>
                    </div>
                </Surface>

                <section className="space-y-3">
                    <SectionHeader
                        title="جعبه‌های Leitner"
                        subtitle="هر جعبه یک مرحله از مسیر مرور است."
                    />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {Object.keys(BOX_NAMES).map((key) => {
                            const boxNumber = Number(key);
                            const count = stats.box_counts[boxNumber] || 0;
                            const box = BOX_NAMES[boxNumber];

                            return (
                                <Surface key={key} className="overflow-hidden">
                                    <div className={`bg-gradient-to-r ${BOX_COLORS[boxNumber]} px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white`}>
                                        {box.title}
                                    </div>
                                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                                        <span className="text-4xl">{box.icon}</span>
                                        <p className="text-sm font-bold text-slate-900">{count} لغت</p>
                                        <p className="text-[11px] leading-5 text-slate-500">{box.subtitle}</p>
                                    </div>
                                </Surface>
                            );
                        })}
                    </div>
                </section>

                {stats.total_due > 0 && (
                    <Surface className="p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">آماده‌ی مرور هستی</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {stats.total_due} کارت منتظر مرور است.
                                </p>
                            </div>
                            <PrimaryButton href="/leitner/review">شروع مرور</PrimaryButton>
                        </div>
                    </Surface>
                )}

                {stats.recent_cards.length > 0 && (
                    <section className="space-y-3">
                        <SectionHeader title="کارت‌های اخیر" subtitle="آخرین واژه‌های ثبت شده در Leitner." />
                        <div className="space-y-3">
                            {stats.recent_cards.map((card) => (
                                <Surface key={card.id} className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${BOX_COLORS[card.box_number]} text-2xl text-white`}>
                                                {BOX_NAMES[card.box_number].icon}
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-900" dir="ltr">{card.word.chinese}</p>
                                                <p className="text-sm text-slate-500" dir="ltr">{card.word.pinyin}</p>
                                            </div>
                                        </div>
                                        <Link href="/leitner/review" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200">
                                            <ArrowRight size={18} className="rotate-180" />
                                        </Link>
                                    </div>
                                </Surface>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
