"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, RotateCcw } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { AppHeader } from "@/components/ui/IconButton";
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

const goalIcon = "/assets/chinverse/icons/Goal.svg";

export default function DailyGoalSettingsPage() {
    const { preferences, setPreference, resetPreferences } = useLearningPreferences();
    const { activeSheet, openSheet, closeSheet } = useOptionSheet();

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <AppHeader
                title="هدف روزانه"
                backHref="/settings"
                iconClassName="bg-transparent shadow-none ring-0"
                icon={<Image src={goalIcon} alt="" width={32} height={32} className="h-8 w-8 object-contain" />}
            />

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <Surface className="border-white bg-white/95 p-5 shadow-[0_16px_44px_rgba(21,90,166,0.08)]">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div className="min-w-0">
                            <p dir="ltr" lang="zh" className="text-lg font-black leading-8 text-slate-950">
                                滴水穿石，绳锯木断
                            </p>
                            <p dir="ltr" lang="zh-Latn" className="mt-1 text-xs font-semibold text-slate-500">
                                Dī shuǐ chuān shí, shéng jù mù duàn
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                در مسیر یادگیری، قدم‌های کوچک اما مداوم نتیجه می‌سازند. هدف روزانه‌ات را ساده، واقعی و قابل ادامه انتخاب کن.
                            </p>
                        </div>
                        <div className="relative flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-[32px] bg-[#f3f7fc]">
                            <Image
                                src={goalIcon}
                                alt=""
                                width={96}
                                height={96}
                                className="h-24 w-24 object-contain"
                                priority
                            />
                        </div>
                    </div>
                </Surface>

                <Surface className="overflow-hidden border-white bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                    <div className="divide-y divide-slate-100">
                        <SelectSettingRow
                            label="زمان هدف روزانه"
                            value={String(preferences.dailyGoalMinutes)}
                            options={dailyGoalMinuteOptions.map((option) => ({
                                value: String(option.value),
                                label: option.label,
                                description: "مدت زمانی که می‌خواهی هر روز برای ویدیو و تمرین بگذاری",
                            }))}
                            onOpen={(value, options) => openSheet({
                                id: "dailyGoalMinutes",
                                title: "زمان هدف روزانه",
                                subtitle: "انتخاب کن هر روز چه مقدار زمان برای یادگیری و دیدن ویدیو هدف‌گذاری شود.",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("dailyGoalMinutes", Number(nextValue)),
                            })}
                        />
                        <SelectSettingRow
                            label="لغات هدف روزانه"
                            value={String(preferences.dailyGoalWords)}
                            options={dailyGoalWordOptions.map((option) => ({
                                value: String(option.value),
                                label: option.label,
                                description: "تعداد لغاتی که می‌خواهی هر روز با لایتنر جلو ببری",
                            }))}
                            onOpen={(value, options) => openSheet({
                                id: "dailyGoalWords",
                                title: "لغات هدف روزانه",
                                subtitle: "اگر با لایتنر تمرین می‌کنی، این مقدار برای تکمیل هدف روزانه حساب می‌شود.",
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
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-4 py-3 text-sm font-black text-white shadow-[0_14px_26px_rgba(21,90,166,0.18)] transition hover:bg-[#0f4e92]"
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
