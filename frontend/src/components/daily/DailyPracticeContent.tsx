"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    BookOpenCheck,
    ChevronLeft,
    ChevronRight,
    Loader2,
    PlayCircle,
    RefreshCw,
    Settings,
    Sparkles,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { useLearningPreferences } from "@/lib/learningPreferences";
import { DailyActivityDay, DailyActivitySummary, dailyActivityService } from "@/services/dailyActivity.service";

const persianWeekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const persianMonthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
];

interface JalaliDateParts {
    year: number;
    month: number;
    day: number;
}

interface CalendarDayCell {
    iso: string;
    jalali: JalaliDateParts;
    gregorian: Date;
}

export default function DailyPracticeContent() {
    const { preferences } = useLearningPreferences();
    const [summary, setSummary] = useState<DailyActivitySummary | null>(null);
    const [visibleMonth, setVisibleMonth] = useState(() => getTodayJalaliMonth());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSummary = async () => {
        try {
            setError(null);
            const data = await dailyActivityService.getSummary(370);
            setSummary(data);
        } catch (loadError) {
            console.error("Failed to load daily activity", loadError);
            setError("آمار آموزش روزانه باز نشد. اتصال را بررسی کن و دوباره تلاش کن.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
    }, []);

    const todayJalali = useMemo(() => getTodayJalali(), []);
    const todayIso = useMemo(() => toLocalIsoDate(new Date()), []);

    const activeGoal = useMemo(() => {
        if (!summary) return 0;
        const minuteGoal = Math.max(preferences.dailyGoalMinutes, 1);
        const wordGoal = Math.max(preferences.dailyGoalWords, 1);
        const videoProgress = Math.min(summary.today.minutes / minuteGoal, 1);
        const wordProgress = Math.min(summary.today.learned_words_count / wordGoal, 1);
        return Math.round(Math.max(videoProgress, wordProgress) * 100);
    }, [preferences.dailyGoalMinutes, preferences.dailyGoalWords, summary]);

    const activityByDate = useMemo(() => {
        return new Map((summary?.calendar || []).map((day) => [day.date, day]));
    }, [summary?.calendar]);

    const monthCells = useMemo(() => buildJalaliMonthGrid(visibleMonth.year, visibleMonth.month), [visibleMonth]);

    const monthStats = useMemo(() => {
        return monthCells.reduce(
            (total, cell) => {
                if (!cell) return total;
                const activity = activityByDate.get(cell.iso);
                return {
                    minutes: total.minutes + (activity?.minutes || 0),
                    words: total.words + (activity?.learned_words_count || 0),
                    activeDays: total.activeDays + (activity?.is_active ? 1 : 0),
                };
            },
            { minutes: 0, words: 0, activeDays: 0 },
        );
    }, [activityByDate, monthCells]);

    const oldestMonth = useMemo(() => {
        const firstDate = summary?.calendar[0]?.date;
        return firstDate ? gregorianIsoToJalali(firstDate) : todayJalali;
    }, [summary?.calendar, todayJalali]);

    const canGoPrevious = compareJalaliMonth(shiftJalaliMonth(visibleMonth, -1), oldestMonth) >= 0;
    const canGoNext = compareJalaliMonth(shiftJalaliMonth(visibleMonth, 1), todayJalali) <= 0;

    if (isLoading) {
        return (
            <div className="motion-list flex min-h-full items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#155aa6]" />
                    <span>در حال آماده‌سازی آمار روزانه…</span>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
                <EmptyState
                    icon={<RefreshCw size={30} />}
                    title="آمار باز نشد"
                    description={error || "داده‌ای برای نمایش پیدا نشد."}
                    action={<PrimaryButton onClick={loadSummary}>تلاش دوباره</PrimaryButton>}
                />
            </div>
        );
    }

    return (
        <div className="min-h-full pb-28" dir="rtl">
            <main className="motion-list mx-auto flex w-full max-w-4xl flex-col gap-4 px-2 py-3">
                <Surface className="p-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-black text-[#155aa6]">هدف امروز</p>
                            <h2 className="mt-0.5 text-[17px] font-black leading-7 text-slate-950">فعالیت روزانه</h2>
                            <p className="mt-0.5 text-xs font-bold leading-6 text-slate-500">
                                {toPersianDigits(preferences.dailyGoalMinutes)} دقیقه ویدیو یا {toPersianDigits(preferences.dailyGoalWords)} لغت
                            </p>
                        </div>
                        <ProgressRing value={activeGoal} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <ActionCard
                            href="/leitner/review"
                            icon={<BookOpenCheck size={19} />}
                            title="مرور لغات"
                            accent="from-emerald-500 to-teal-500"
                        />
                        <ActionCard
                            href="/explore"
                            icon={<PlayCircle size={19} />}
                            title="دیدن ویدیو"
                            accent="from-[#155aa6] to-[#0f4e92]"
                        />
                    </div>
                    <Link
                        href="/settings/daily"
                        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                    >
                        <Settings size={15} />
                        تغییر هدف روزانه
                    </Link>
                </Surface>

                <LearningStatsPanel summary={summary} />

                <Surface className="p-4">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => setVisibleMonth((current) => shiftJalaliMonth(current, -1))}
                            disabled={!canGoPrevious}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label="ماه قبل"
                        >
                            <ChevronRight size={20} />
                        </button>
                        <div className="text-center">
                            <p className="text-xs font-black text-[#155aa6]">تقویم شمسی فعالیت</p>
                            <h2 className="mt-0.5 text-lg font-black text-slate-950">
                                {formatJalaliMonthTitle(visibleMonth)}
                            </h2>
                            <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                                {toPersianDigits(monthStats.activeDays)} روز فعال، {toPersianDigits(monthStats.minutes)} دقیقه، {toPersianDigits(monthStats.words)} لغت
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setVisibleMonth((current) => shiftJalaliMonth(current, 1))}
                            disabled={!canGoNext}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label="ماه بعد"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    </div>
                    <ActivityCalendar
                        days={monthCells}
                        activityByDate={activityByDate}
                        todayIso={todayIso}
                    />
                </Surface>

                <Surface className="p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-[#155aa6]">نمودار هفتگی</p>
                        <BarChart3 className="text-slate-300" size={22} />
                    </div>
                    <WeeklyCharts days={summary.weekly_chart} />
                </Surface>
            </main>
        </div>
    );
}

function ProgressRing({ value }: { value: number }) {
    const clamped = Math.max(0, Math.min(value, 100));
    return (
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `conic-gradient(#155aa6 ${clamped * 3.6}deg, #e2e8f0 0deg)`,
                }}
            />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-black text-slate-950">
                {toPersianDigits(clamped)}٪
            </div>
        </div>
    );
}

function ActionCard({
    href,
    icon,
    title,
    accent,
}: {
    href: string;
    icon: ReactNode;
    title: string;
    accent: string;
}) {
    return (
        <Link href={href} className="group">
            <div className="flex h-16 items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 transition group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-lg">
                <div className={cn("inline-flex rounded-2xl bg-gradient-to-br p-2.5 text-white shadow-lg", accent)}>
                    {icon}
                </div>
                <h3 className="text-sm font-black text-slate-950">{title}</h3>
            </div>
        </Link>
    );
}

function LearningStatsPanel({ summary }: { summary: DailyActivitySummary }) {
    const stats = [
        {
            label: "بلندترین زنجیره تا امروز:",
            value: summary.streak.longest_days,
            suffix: "روز",
        },
        {
            label: "مجموع کل دقایق دیده شده:",
            value: summary.totals.minutes,
            suffix: "دقیقه",
        },
        {
            label: "تعداد کل لغات آموخته شده:",
            value: summary.totals.learned_words_count,
            suffix: "عدد",
        },
    ];

    return (
        <section className="grid grid-cols-[72px_1fr] items-center gap-3 rounded-[10px] bg-[#f0a58d] px-3 py-3 text-[#25272d] shadow-[0_8px_18px_rgba(15,23,42,0.10)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-[10px] bg-white/20 text-[#155aa6]">
                <Sparkles size={38} strokeWidth={1.8} />
            </div>
            <div className="space-y-1.5">
                {stats.map((stat) => (
                    <div key={stat.label} className="grid grid-cols-[1fr_46px_34px] items-center gap-2 text-[11px] font-black leading-5">
                        <span className="text-right">{stat.label}</span>
                        <span className="flex h-6 items-center justify-center rounded-[8px] border border-[#155aa6]/70 bg-[#f8d4c7] text-[12px] text-[#25272d]">
                            {toPersianDigits(stat.value)}
                        </span>
                        <span className="text-right text-[10px] font-bold">{stat.suffix}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ActivityCalendar({
    days,
    activityByDate,
    todayIso,
}: {
    days: Array<CalendarDayCell | null>;
    activityByDate: Map<string, DailyActivityDay>;
    todayIso: string;
}) {
    return (
        <div className="mt-3">
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-400">
                {persianWeekdays.map((day) => (
                    <span key={day}>{day}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((cell, index) => {
                    if (!cell) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const activity = activityByDate.get(cell.iso);
                    const isToday = cell.iso === todayIso;
                    return (
                        <div
                            key={cell.iso}
                            title={`${formatJalaliFull(cell.jalali)} - ${toPersianDigits(activity?.minutes || 0)} دقیقه - ${toPersianDigits(activity?.learned_words_count || 0)} لغت`}
                            className={cn(
                                "relative flex aspect-square min-h-7 items-center justify-center rounded-[10px] border text-[10px] font-black transition",
                                intensityClass(activity?.intensity || 0),
                                activity?.is_active ? "border-white shadow-sm" : "border-slate-100",
                                isToday && "ring-2 ring-[#155aa6] ring-offset-2",
                            )}
                        >
                            {toPersianDigits(cell.jalali.day)}
                            {activity?.is_active && (
                                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-white/90 shadow" />
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>کم</span>
                <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((value) => (
                        <span key={value} className={cn("h-3 w-3 rounded-md", intensityClass(value))} />
                    ))}
                </div>
                <span>زیاد</span>
            </div>
        </div>
    );
}

function WeeklyCharts({ days }: { days: DailyActivityDay[] }) {
    return (
        <div className="mt-4 grid gap-4">
            <div>
                <h3 className="mb-2 text-right text-sm font-black text-slate-800">دقایق ویدیو</h3>
                <div className="flex h-28 items-end gap-2 rounded-[20px] bg-slate-50 px-3 pb-3 pt-4">
                    {days.map((day) => (
                        <ChartBar key={`${day.date}-minutes`} value={day.minutes_ratio || 0} label={shortDay(day.date)} />
                    ))}
                </div>
            </div>
            <div>
                <h3 className="mb-2 text-right text-sm font-black text-slate-800">لغات آموخته‌شده</h3>
                <div className="flex h-28 items-end gap-2 rounded-[20px] bg-slate-50 px-3 pb-3 pt-4">
                    {days.map((day) => (
                        <ChartBar
                            key={`${day.date}-words`}
                            value={day.words_ratio || 0}
                            label={shortDay(day.date)}
                            warm
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ChartBar({ value, label, warm = false }: { value: number; label: string; warm?: boolean }) {
    const height = Math.max(10, Math.round(Math.max(0, Math.min(value, 1)) * 72));
    return (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-20 w-full items-end justify-center">
                <div
                    className={cn(
                        "w-full max-w-7 rounded-t-xl rounded-b-md",
                        warm ? "bg-gradient-to-t from-[#ffb74d] to-[#ffd88a]" : "bg-gradient-to-t from-[#155aa6] to-[#77b7f2]",
                    )}
                    style={{ height }}
                />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{label}</span>
        </div>
    );
}

function intensityClass(intensity: number) {
    const classes = [
        "bg-slate-100 text-slate-400",
        "bg-[#dbeafe] text-[#155aa6]",
        "bg-[#77b7f2] text-white",
        "bg-[#50bca4] text-white",
        "bg-[#123f73] text-white",
    ];
    return classes[Math.max(0, Math.min(intensity, classes.length - 1))];
}

function buildJalaliMonthGrid(year: number, month: number): Array<CalendarDayCell | null> {
    const firstDayDate = jalaliDateToGregorianDate(year, month, 1);
    const startOffset = (firstDayDate.getUTCDay() + 1) % 7;
    const cells: Array<CalendarDayCell | null> = Array.from({ length: startOffset }, () => null);
    const monthLength = getJalaliMonthLength(year, month);

    for (let day = 1; day <= monthLength; day += 1) {
        const gregorian = jalaliDateToGregorianDate(year, month, day);
        cells.push({
            iso: toUtcIsoDate(gregorian),
            jalali: { year, month, day },
            gregorian,
        });
    }

    return cells;
}

function shiftJalaliMonth(month: Pick<JalaliDateParts, "year" | "month">, delta: number) {
    const monthIndex = month.year * 12 + (month.month - 1) + delta;
    return {
        year: Math.floor(monthIndex / 12),
        month: (monthIndex % 12) + 1,
    };
}

function compareJalaliMonth(a: Pick<JalaliDateParts, "year" | "month">, b: Pick<JalaliDateParts, "year" | "month">) {
    return a.year * 12 + a.month - (b.year * 12 + b.month);
}

function getTodayJalali(): JalaliDateParts {
    const now = new Date();
    return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function getTodayJalaliMonth() {
    const today = getTodayJalali();
    return { year: today.year, month: today.month };
}

function gregorianIsoToJalali(value: string): JalaliDateParts {
    const [year, month, day] = value.split("-").map(Number);
    return gregorianToJalali(year, month, day);
}

function formatJalaliMonthTitle(value: Pick<JalaliDateParts, "year" | "month">) {
    return `${persianMonthNames[value.month - 1]} ${toPersianDigits(value.year)}`;
}

function formatJalaliFull(value: JalaliDateParts) {
    const date = jalaliDateToGregorianDate(value.year, value.month, value.day);
    const weekday = date.toLocaleDateString("fa-IR", { weekday: "long", timeZone: "UTC" });
    return `${weekday} ${toPersianDigits(value.day)} ${persianMonthNames[value.month - 1]} ${toPersianDigits(value.year)}`;
}

function shortDay(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString("fa-IR", {
        weekday: "short",
    });
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}

function toUtcIsoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function toLocalIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getJalaliMonthLength(year: number, month: number) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return isJalaliLeapYear(year) ? 30 : 29;
}

function isJalaliLeapYear(year: number) {
    const current = jalaliDateToGregorianDate(year, 1, 1).getTime();
    const next = jalaliDateToGregorianDate(year + 1, 1, 1).getTime();
    return Math.round((next - current) / 86_400_000) === 366;
}

function jalaliDateToGregorianDate(year: number, month: number, day: number) {
    const [gy, gm, gd] = jalaliToGregorian(year, month, day);
    return new Date(Date.UTC(gy, gm - 1, gd));
}

function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDateParts {
    const gDayMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    gy -= gy <= 1600 ? 621 : 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days =
        365 * gy +
        Math.floor((gy2 + 3) / 4) -
        Math.floor((gy2 + 99) / 100) +
        Math.floor((gy2 + 399) / 400) -
        80 +
        gd +
        gDayMonth[gm - 1];

    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }

    const month = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const day = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return { year: jy, month, day };
}

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    jy += 1595;
    let days =
        -355668 +
        365 * jy +
        Math.floor(jy / 33) * 8 +
        Math.floor(((jy % 33) + 3) / 4) +
        jd +
        (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;

    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365) days += 1;
    }

    gy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }

    let gd = days + 1;
    const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
    const months = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 1;
    while (gm <= 12 && gd > months[gm]) {
        gd -= months[gm];
        gm += 1;
    }

    return [gy, gm, gd];
}
