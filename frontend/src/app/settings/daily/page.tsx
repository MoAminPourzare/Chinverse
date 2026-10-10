"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { AppHeader } from "@/components/ui/IconButton";
import LeitnerGoalSheet from "@/components/settings/LeitnerGoalSheet";
import {
    parseGoalInput,
    useLearningPreferences,
} from "@/lib/learningPreferences";
import { studyMinuteCards } from "@/lib/studyMotivation";
import styles from "./DailyGoal.module.css";

const goalIcon = "/assets/chinverse/icons/Goal.svg";


export default function DailyGoalSettingsPage() {
    const { preferences, setPreference, resetPreferences } = useLearningPreferences();
    const [isWordGoalOpen, setIsWordGoalOpen] = useState(false);

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <AppHeader
                title="هدف روزانه"
                backHref="/settings"
                iconClassName="bg-transparent shadow-none ring-0"
                icon={<Image src={goalIcon} alt="" width={32} height={32} className="h-8 w-8 object-contain" priority />}
            />

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <Surface className="border-white bg-white/95 p-5 shadow-[0_16px_44px_rgba(21,90,166,0.08)]">
                    <div className="flex items-center gap-4">
                        <div className="relative flex h-[118px] w-[118px] shrink-0 items-center justify-center rounded-[30px] bg-[#f3f7fc]">
                            <Image
                                src={goalIcon}
                                alt=""
                                width={112}
                                height={112}
                                className="h-28 w-28 object-contain"
                                priority
                            />
                        </div>
                        <div className="min-w-0 flex-1 text-center">
                            <p dir="ltr" lang="zh" className="font-cjk text-[18px] font-black leading-8 text-slate-950">
                                滴水穿石
                            </p>
                            <p dir="ltr" lang="zh-Latn" className="mt-1 text-xs font-semibold text-slate-500">
                                dī shuǐ chuān shí
                            </p>
                            <p className="mt-4 text-sm font-medium leading-8 text-slate-700">
                                قطره‌های آب با نرمی و مداومت سنگ رو می‌تراشن؛ تو هم با تمرین‌های کوچک روزانه، مسیر یادگیریت رو می‌سازی؛ آروم و پیوسته اما مؤثر.
                            </p>
                        </div>
                    </div>
                </Surface>

                <StudyTimeGoalPicker
                    value={preferences.dailyGoalMinutes}
                    onChange={(nextValue) => setPreference("dailyGoalMinutes", nextValue)}
                />

                <Surface className="overflow-hidden border-white bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                    <div className="divide-y divide-slate-100">
                        <button type="button" onClick={() => setIsWordGoalOpen(true)} className="flex min-h-[62px] w-full items-center justify-between gap-3 px-4 py-3 text-right transition hover:bg-[#f8fbff] dark:hover:bg-[#202936]">
                            <span className="text-sm font-black text-slate-800 dark:text-[#e8edf4]">هدف روزانه لایتنر</span>
                            <span className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-[#aab4c2]">{toPersianDigits(preferences.dailyGoalWords)} لغت<ChevronLeft aria-hidden size={16} /></span>
                        </button>
                    </div>
                </Surface>

                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/?tab=daily"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-4 py-3 text-sm font-black text-white shadow-[0_14px_26px_rgba(21,90,166,0.18)] transition hover:bg-[#0f4e92]"
                    >
                        <CalendarDays size={17} />
                        روند یادگیری
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

            {isWordGoalOpen && (
                <LeitnerGoalSheet
                    value={preferences.dailyGoalWords}
                    onClose={() => setIsWordGoalOpen(false)}
                    onSave={(value) => {
                        setPreference("dailyGoalWords", value);
                        setIsWordGoalOpen(false);
                    }}
                />
            )}
        </div>
    );
}

function StudyTimeGoalPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    const [customMinutes, setCustomMinutes] = useState("");
    const activeIndex = getStudyTimeCardIndex(value);
    const canGoPrevious = value > studyMinuteCards[0].minutes;
    const canGoNext = Number.isSafeInteger(Math.floor(value / 10) * 10 + 10);
    const customValue = parseGoalInput(customMinutes);
    const canApplyCustom = customValue !== null;

    const goPrevious = () => {
        onChange(Math.max(0, Math.ceil(value / 10) * 10 - 10));
    };

    const goNext = () => {
        if (canGoNext) onChange(Math.floor(value / 10) * 10 + 10);
    };

    const applyCustomMinutes = () => {
        if (customValue === null) return;
        onChange(customValue);
        setCustomMinutes("");
    };

    return (
        <Surface className="overflow-hidden border-white bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div role="group" aria-label="زمان هدف روزانه" className="relative overflow-hidden rounded-[8px] bg-[#efa38d] px-3 pb-5 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                <PracticeProgress value={value} onSelect={onChange} />

                <div className="mx-auto mt-5 grid max-w-[520px]">
                    {/* All quotes size the same grid cell, including the longest at this screen width. */}
                    {studyMinuteCards.map((card, index) => (
                        <div
                            key={card.minutes}
                            aria-hidden={index !== activeIndex}
                            style={{ gridArea: "1 / 1", visibility: index === activeIndex ? "visible" : "hidden" }}
                            className={`${index === activeIndex ? "tab-content-motion" : ""} flex min-h-[116px] min-w-0 flex-col items-center justify-center text-center`}
                        >
                            <p className="mb-2 text-[12px] font-black text-[#10467f]">
                                هدف مطالعه: {toPersianDigits(value)} دقیقه
                            </p>
                            <p className="text-[13px] font-medium leading-7 text-slate-950">
                                {card.persian}
                            </p>
                            <p dir="ltr" lang="zh" className="font-cjk mt-1 text-[15px] font-semibold leading-7 text-slate-900">
                                {card.chinese}
                            </p>
                            <p dir="ltr" lang="zh-Latn" className="mt-1 text-[12px] font-medium leading-5 text-slate-800">
                                {card.pinyin}
                            </p>
                        </div>
                    ))}
                </div>

                <div dir="ltr" className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <button
                        type="button"
                        onClick={goPrevious}
                        disabled={!canGoPrevious}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-white/75 px-3 text-xs font-black text-[#155aa6] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={17} />
                        کمتر
                    </button>
                    <span dir="rtl" title={`${toPersianDigits(value)} دقیقه`} className="max-w-24 truncate text-center text-[11px] font-black text-slate-800">
                        {toPersianDigits(value)} دقیقه
                    </span>
                    <button
                        type="button"
                        onClick={goNext}
                        disabled={!canGoNext}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-[#155aa6] px-3 text-xs font-black text-white shadow-[0_12px_24px_rgba(21,90,166,0.24)] transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:bg-white/55 disabled:text-[#155aa6]"
                    >
                        بیشتر
                        <ChevronRight size={17} />
                    </button>
                </div>

                <div className="mt-4 rounded-[8px] bg-white/60 p-3">
                    <label htmlFor="customDailyMinutes" className="block text-right text-[12px] font-black text-slate-900">
                        سایر دقایق
                    </label>
                    <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                        <input
                            id="customDailyMinutes"
                            type="text"
                            inputMode="numeric"
                            aria-describedby="customDailyMinutesHelp"
                            value={customMinutes}
                            onChange={(event) => setCustomMinutes(event.target.value)}
                            placeholder="مثلا ۱۸۰"
                            className="h-11 min-w-0 rounded-[8px] border border-white bg-white px-3 text-center text-sm font-black text-slate-900 outline-none transition focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10"
                        />
                        <button
                            type="button"
                            onClick={applyCustomMinutes}
                            disabled={!canApplyCustom}
                            className="h-11 rounded-[8px] bg-[#155aa6] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(21,90,166,0.20)] transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                        >
                            ثبت
                        </button>
                    </div>
                    <p id="customDailyMinutesHelp" className="mt-2 text-right text-[11px] font-bold leading-5 text-slate-700">
                        زمان دلخواهت را وارد کن؛ مثلا ۱۸۰ دقیقه برای یک فیلم سه‌ساعته.
                    </p>
                </div>
            </div>
        </Surface>
    );
}

function PracticeProgress({ value, onSelect }: { value: number; onSelect: (value: number) => void }) {
    const progress = Math.min(Math.max(value, 0), 100);
    const ticks = Array.from({ length: 11 }, (_, index) => index * 10);

    return (
        <div dir="ltr">
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-900" dir="rtl">
                <label htmlFor="daily-goal-minutes">زمان مطالعه روزانه</label>
                <span title={`${toPersianDigits(value)} دقیقه`} className="max-w-[48%] truncate rounded-lg bg-[#155aa6] px-3 py-2 font-black text-white">{toPersianDigits(value)} دقیقه</span>
            </div>
            <input
                id="daily-goal-minutes"
                type="range"
                min={0}
                max={100}
                step={1}
                value={progress}
                aria-valuetext={`${toPersianDigits(progress)} دقیقه`}
                onChange={(event) => onSelect(Number(event.target.value))}
                className={styles.slider}
                style={{ "--goal-progress": `${progress}%` } as CSSProperties}
            />
            <div className={styles.ticks}>
                {ticks.map((minutes) => (
                    <button key={minutes} type="button" data-inline-action="true" onClick={() => onSelect(minutes)} aria-label={`${minutes} دقیقه`} aria-pressed={value === minutes} className={styles.tick}>
                        <span aria-hidden className={styles.tickMark} />
                        <span aria-hidden>{toPersianDigits(minutes)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function getStudyTimeCardIndex(value: number) {
    let selectedIndex = 0;
    studyMinuteCards.forEach((card, index) => {
        if (value >= card.minutes) {
            selectedIndex = index;
        }
    });
    return selectedIndex;
}

function toPersianDigits(value: number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
