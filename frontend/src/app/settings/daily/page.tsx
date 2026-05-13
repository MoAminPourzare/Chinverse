"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CalendarDays, Flame, RotateCcw, Target } from "lucide-react";
import Surface from "@/components/ui/Surface";
import {
    OptionSheet,
    SelectSettingRow,
    useOptionSheet,
} from "@/components/settings/SettingsControls";
import {
    dailyGoalMinuteOptions,
    dailyGoalWordOptions,
    useLearningPreferences,
} from "@/lib/learningPreferences";

export default function DailyGoalSettingsPage() {
    const { preferences, setPreference, resetPreferences } = useLearningPreferences();
    const { activeSheet, openSheet, closeSheet } = useOptionSheet();

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <header className="sticky top-3 z-40 mb-5 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <Link
                    href="/settings"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100"
                    aria-label="بازگشت"
                >
                    <ArrowRight size={22} />
                </Link>
                <div className="text-center">
                    <h1 className="text-base font-black text-slate-950">هدف روزانه</h1>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">زمان تمرین و تعداد لغات</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 text-rose-600">
                    <Target size={22} />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <section className="overflow-hidden rounded-[32px] border border-slate-900 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                    <div className="relative p-5">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.35),transparent_34%),linear-gradient(135deg,#0f172a_0%,#7f1d1d_55%,#f59e0b_130%)]" />
                        <div className="relative">
                            <p className="text-xs font-black text-amber-100">Daily Goal</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">تمرین روزانه را به اندازه خودت تنظیم کن</h2>
                            <p className="mt-3 text-sm leading-7 text-white/75">
                                این مقدارها در صفحه آموزش روزانه برای کامل شدن هدف، استریک و تقویم فعالیت استفاده می‌شوند.
                            </p>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <GoalSummary icon={<CalendarDays size={18} />} label="زمان ویدیو" value={`${toPersianDigits(preferences.dailyGoalMinutes)} دقیقه`} />
                                <GoalSummary icon={<Flame size={18} />} label="لغات لایتنر" value={`${toPersianDigits(preferences.dailyGoalWords)} لغت`} />
                            </div>
                        </div>
                    </div>
                </section>

                <Surface className="overflow-hidden border-white bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                    <div className="divide-y divide-slate-100">
                        <SelectSettingRow
                            label="زمان هدف روزانه"
                            value={String(preferences.dailyGoalMinutes)}
                            options={dailyGoalMinuteOptions.map((option) => ({
                                value: String(option.value),
                                label: option.label,
                                description: "میزان زمانی که می‌خواهی روزانه ویدیو ببینی",
                            }))}
                            onOpen={(value, options) => openSheet({
                                id: "dailyGoalMinutes",
                                title: "زمان هدف روزانه",
                                subtitle: "انتخاب کن هر روز چه مقدار زمان برای یادگیری و دیدن ویدیو هدف‌گذاری شود",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("dailyGoalMinutes", Number(nextValue)),
                            })}
                        />
                        <SelectSettingRow
                            label="هدف لغات روزانه"
                            value={String(preferences.dailyGoalWords)}
                            options={dailyGoalWordOptions.map((option) => ({
                                value: String(option.value),
                                label: option.label,
                                description: "تعداد لغاتی که با لایتنر می‌خواهی روزانه جلو ببری",
                            }))}
                            onOpen={(value, options) => openSheet({
                                id: "dailyGoalWords",
                                title: "هدف لغات روزانه",
                                subtitle: "اگر با لایتنر تمرین می‌کنی، این مقدار برای تکمیل هدف روزانه حساب می‌شود",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("dailyGoalWords", Number(nextValue)),
                            })}
                        />
                    </div>
                </Surface>

                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/daily-practice"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
                    >
                        <CalendarDays size={17} />
                        صفحه روزانه
                    </Link>
                    <button
                        type="button"
                        onClick={resetPreferences}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <RotateCcw size={17} />
                        پیش‌فرض
                    </button>
                </div>
            </main>

            {activeSheet && (
                <OptionSheet
                    sheet={activeSheet}
                    onClose={closeSheet}
                />
            )}
        </div>
    );
}

function GoalSummary({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-[22px] border border-white/15 bg-white/[0.10] p-3">
            <div className="flex items-center gap-2 text-amber-100">
                {icon}
                <p className="text-[11px] font-bold text-white/60">{label}</p>
            </div>
            <p className="mt-2 text-lg font-black text-white">{value}</p>
        </div>
    );
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
