"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Brain, CalendarClock, CheckCircle2, Clock3, Layers, Sprout, TrendingUp, Trophy } from "lucide-react";
import api from "@/lib/api";
import Surface from "@/components/ui/Surface";
import SectionHeader from "@/components/ui/SectionHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ProgressBar from "@/components/ui/ProgressBar";

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

const BOX_COLORS: Record<number, string> = {
    1: "from-rose-500 to-orange-500",
    2: "from-amber-500 to-orange-500",
    3: "from-emerald-500 to-teal-500",
    4: "from-sky-500 to-blue-600",
    5: "from-indigo-600 to-slate-900",
};

const BOX_INFO = {
    1: { title: "شروع", subtitle: "مرور نزدیک؛ واژه هنوز تازه است.", icon: Sprout },
    2: { title: "در حال تثبیت", subtitle: "اگر بلد باشی، فاصله مرور بیشتر می‌شود.", icon: Brain },
    3: { title: "نیمه پایدار", subtitle: "واژه وارد حافظه میان مدت شده است.", icon: TrendingUp },
    4: { title: "قوی", subtitle: "مرور دیرتر انجام می‌شود.", icon: Layers },
    5: { title: "یادگرفته شده", subtitle: "واژه تثبیت شده و فقط دوره‌ای مرور می‌شود.", icon: Trophy },
};

function formatReviewTime(value?: string | null) {
    if (!value) return "زمانی ثبت نشده";

    const date = new Date(value);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) return "آماده مرور";
    if (diffDays <= 1) return "فردا";
    return `${diffDays.toLocaleString("fa-IR")} روز دیگر`;
}

function formatFullDate(value?: string | null) {
    if (!value) return "";
    return new Date(value).toLocaleDateString("fa-IR", { weekday: "long", month: "long", day: "numeric" });
}

export default function LeitnerDashboard() {
    const [stats, setStats] = useState<LeitnerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get<LeitnerStats>("/leitner/dashboard");
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch leitner stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const learnedPercent = useMemo(() => {
        if (!stats?.total_cards) return 0;
        return Math.round((stats.mastered_count / stats.total_cards) * 100);
    }, [stats]);

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

    return (
        <div className="min-h-full px-4 py-4" dir="rtl">
            <main className="mx-auto flex w-full flex-col gap-5 pb-8">
                <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                    <div className="relative p-5">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_46%,#334155_100%)]" />
                        <div className="absolute -left-12 top-0 h-44 w-44 rounded-full bg-rose-500/30 blur-3xl" />
                        <div className="absolute -bottom-20 right-12 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85">
                                <Brain size={15} />
                                Leitner
                            </div>
                            <h1 className="mt-4 text-2xl font-black leading-9 tracking-tight">مرور واژه‌ها با مسیر روشن</h1>
                            <p className="mt-3 text-sm leading-7 text-white/72">
                                هر واژه با جواب درست یک جعبه جلو می‌رود و مرور بعدی دیرتر می‌شود. اگر فراموش شود، به جعبه اول برمی‌گردد.
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <HeroStat label="آماده مرور" value={stats.total_due} icon={<Clock3 size={18} />} />
                                <HeroStat label="یادگرفته‌شده" value={stats.mastered_count} icon={<Trophy size={18} />} />
                                <HeroStat label="کل کارت‌ها" value={stats.total_cards} icon={<Layers size={18} />} />
                                <HeroStat label="مرور آینده" value={stats.upcoming_count} icon={<CalendarClock size={18} />} />
                            </div>
                        </div>
                    </div>
                </section>

                <Surface className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-black text-slate-950">واژه‌های تثبیت‌شده</h2>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                جعبه ۵ یعنی واژه تقریبا یاد گرفته شده و فقط برای تازه ماندن حافظه، ماهانه مرور می‌شود.
                            </p>
                            <ProgressBar value={learnedPercent} helper={`${learnedPercent.toLocaleString("fa-IR")}٪ از کل کارت‌ها`} className="mt-4" />
                        </div>
                    </div>
                </Surface>

                {stats.total_due > 0 ? (
                    <Surface className="p-5">
                        <div className="flex flex-col gap-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-950">الان وقت مرور است</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    {stats.total_due.toLocaleString("fa-IR")} کارت آماده است. بعد از جواب درست، کارت به جعبه بعدی می‌رود.
                                </p>
                            </div>
                            <PrimaryButton href="/leitner/review" className="w-full">شروع مرور</PrimaryButton>
                        </div>
                    </Surface>
                ) : (
                    <Surface className="p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                                <CalendarClock size={22} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-950">فعلا کارتی برای مرور نیست</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    مرور بعدی: {formatReviewTime(stats.next_due_at)}
                                    {stats.next_due_at ? ` (${formatFullDate(stats.next_due_at)})` : ""}
                                </p>
                            </div>
                        </div>
                    </Surface>
                )}

                <section className="space-y-3">
                    <SectionHeader
                        title="جعبه‌های لایتنر"
                        subtitle="هر جعبه یعنی مرور بعدی با فاصله بیشتری انجام می‌شود."
                    />

                    <div className="space-y-3">
                        {Object.keys(BOX_INFO).map((key) => {
                            const boxNumber = Number(key) as keyof typeof BOX_INFO;
                            const box = BOX_INFO[boxNumber];
                            const Icon = box.icon;
                            const count = stats.box_counts[String(boxNumber)] || 0;
                            const dueCount = stats.due_by_box[String(boxNumber)] || 0;
                            const interval = stats.box_intervals[String(boxNumber)] || 1;

                            return (
                                <Surface key={key} className="overflow-hidden p-0">
                                    <div className={`h-1.5 bg-gradient-to-r ${BOX_COLORS[boxNumber]}`} />
                                    <div className="flex items-center gap-3 p-4">
                                        <div className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br ${BOX_COLORS[boxNumber]} text-white shadow-lg`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-base font-black text-slate-950">{box.title}</h3>
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                                    {count.toLocaleString("fa-IR")} کارت
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">{box.subtitle}</p>
                                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                                                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-600">
                                                    آماده: {dueCount.toLocaleString("fa-IR")}
                                                </span>
                                                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                                                    فاصله بعدی: {interval.toLocaleString("fa-IR")} روز
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Surface>
                            );
                        })}
                    </div>
                </section>

                {stats.recent_cards.length > 0 && (
                    <section className="space-y-3">
                        <SectionHeader title="کارت‌های اخیر" subtitle="برای هر کارت می‌بینی کی دوباره باید مرور شود." />
                        <div className="space-y-3">
                            {stats.recent_cards.map((card) => {
                                const boxNumber = card.box_number as keyof typeof BOX_INFO;

                                return (
                                    <Surface key={card.id} className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${BOX_COLORS[boxNumber]} text-white`}>
                                                    <span className="text-sm font-black">{boxNumber}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-cjk text-lg font-bold text-slate-900" dir="ltr" lang="zh-CN">{card.word.chinese}</p>
                                                    <p className="font-latin truncate text-sm text-slate-500" dir="ltr" lang="en">{card.word.pinyin}</p>
                                                    <p className="mt-1 text-xs font-semibold text-rose-600">
                                                        مرور بعدی: {formatReviewTime(card.next_review_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link href="/leitner/review" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200">
                                                <ArrowRight size={18} className="rotate-180" />
                                            </Link>
                                        </div>
                                    </Surface>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

function HeroStat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
    return (
        <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
            <div className="flex items-center justify-between gap-2 text-white/65">
                <p className="text-[11px] font-semibold">{label}</p>
                {icon}
            </div>
            <p className="mt-2 text-2xl font-black text-white">{value.toLocaleString("fa-IR")}</p>
        </div>
    );
}
