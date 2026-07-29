"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { AppHeader } from "@/components/ui/IconButton";
import {
    OptionSheet,
    SelectSettingRow,
    useOptionSheet,
} from "@/components/settings/SettingsControls";
import {
    dailyGoalWordOptions,
    useLearningPreferences,
} from "@/lib/learningPreferences";
import { cn } from "@/lib/cn";

const goalIcon = "/assets/chinverse/icons/Goal.svg";

const studyMinuteCards = [
    {
        minutes: 0,
        persian: "از زیاد گفتن نترس، از ایستادن بترس.",
        chinese: "不怕慢，就怕站",
        pinyin: "Bù pà màn, jiù pà zhàn",
    },
    {
        minutes: 10,
        persian: "سفر هزار فرسنگی، با قدم اول آغاز می‌شود. (لائوتسه)",
        chinese: "千里之行，始于足下。（老子）",
        pinyin: "Qiānlǐ zhī xíng, shǐ yú zú xià",
    },
    {
        minutes: 20,
        persian: "اگر پشتکار کافی باشد، میله آهنی هم به سوزن تبدیل می‌شود.",
        chinese: "只要功夫深，铁杵磨成针",
        pinyin: "Zhǐ yào gōng fu shēn, tiě chǔ mó chéng zhēn",
    },
    {
        minutes: 30,
        persian: "تائو در سکوت جاریست، نه عجله دارد، نه توقف، اما همه چیز را به انجام می‌رساند. (لائوتسه)",
        chinese: "道常无为而无不为。（老子）",
        pinyin: "Dào cháng wú wéi ér wú bù wéi",
    },
    {
        minutes: 40,
        persian: "یادگیری بدون اندیشه، بی‌فایده است. اندیشه بدون یادگیری، خطرناک است. (کنفوسیوس)",
        chinese: "学而不思则罔，思而不学则殆。（孔子）",
        pinyin: "Xué ér bù sī zé wǎng, sī ér bù xué zé dài",
    },
    {
        minutes: 50,
        persian: "کسی که چیزی را میداند به خوبی کسی که به آن علاقه دارد نیست، و کسی که علاقه دارد به خوبی کسی که از آن لذت میبرد نیست. (کنفوسیوس)",
        chinese: "知之者不如好之者，好之者不如乐之者。（孔子）",
        pinyin: "Zhī zhī zhě bù rú hào zhī zhě, hào zhī zhě bù rú lè zhī zhě",
    },
    {
        minutes: 60,
        persian: "کسی که قانع است، ثروتمند است و کسی که بر خویش چیره شود نیرومند است. (لائوتسه)",
        chinese: "知足者富，自胜者强。（老子）",
        pinyin: "Zhīzú zhě fù, zì qiáng zhě qiáng",
    },
    {
        minutes: 70,
        persian: "تیغ برنده از صیقل خوردن مدام ساخته می‌شود و عطر شکوفه آلو از سرمای سخت زمستان. (بدون رنج، موفقیت نمی‌آید)",
        chinese: "宝剑锋从磨砺出，梅花香自苦寒来",
        pinyin: "Bǎo jiàn fēng cóng mó lì chū, méi huā xiāng zì kǔ hán lái",
    },
    {
        minutes: 80,
        persian: "دانستن اینکه چه می‌دانی و چه نمی‌دانی، همان خرد واقعیست. (کنفوسیوس)",
        chinese: "知之为知之，不知为不知，是知也。（孔子）",
        pinyin: "Zhī zhī wéi zhī zhī, bù zhī wéi bù zhī, shì zhī yě",
    },
    {
        minutes: 90,
        persian: "مهارت از تلاش بدست میاید و با بی‌خیالی از بین می‌رود. (هان یو)",
        chinese: "业精于勤荒于嬉",
        pinyin: "Yè jīng yú qín, huāng yú xī",
    },
    {
        minutes: 100,
        persian: "یادگیری نباید متوقف شود. (کنفوسیوس)",
        chinese: "学不可以已。（孔子）",
        pinyin: "Xué bù kě yǐ yǐ",
    },
];

export default function DailyGoalSettingsPage() {
    const { preferences, setPreference, resetPreferences } = useLearningPreferences();
    const { activeSheet, openSheet, closeSheet } = useOptionSheet();

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

            {activeSheet && (
                <OptionSheet
                    sheet={activeSheet}
                    onClose={closeSheet}
                />
            )}
        </div>
    );
}

function StudyTimeGoalPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    const [customMinutes, setCustomMinutes] = useState("");
    const activeIndex = getStudyTimeCardIndex(value);
    const activeCard = studyMinuteCards[activeIndex];
    const canGoPrevious = value > studyMinuteCards[0].minutes;
    const canGoNext = value < studyMinuteCards[studyMinuteCards.length - 1].minutes;
    const trimmedCustomMinutes = customMinutes.trim();
    const customValue = Number(trimmedCustomMinutes);
    const canApplyCustom = trimmedCustomMinutes !== "" && Number.isFinite(customValue) && customValue >= 0 && customValue <= 300;

    const goPrevious = () => {
        const previous = [...studyMinuteCards].reverse().find((card) => card.minutes < value);
        if (previous) onChange(previous.minutes);
    };

    const goNext = () => {
        const next = studyMinuteCards.find((card) => card.minutes > value);
        if (next) onChange(next.minutes);
    };

    const applyCustomMinutes = () => {
        if (!canApplyCustom) return;
        onChange(Math.round(customValue));
        setCustomMinutes("");
    };

    return (
        <Surface className="overflow-hidden border-white bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="relative overflow-hidden rounded-[8px] bg-[#efa38d] px-3 pb-5 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                <PracticeProgress progress={Math.min(Math.max(value, 0), 100)} onSelect={onChange} />

                <div key={activeCard.chinese} className="tab-content-motion mx-auto mt-10 flex min-h-[116px] max-w-[520px] flex-col items-center justify-center text-center">
                    <p className="mb-2 text-[12px] font-black text-[#155aa6]">
                        هدف مطالعه: {toPersianDigits(value)} دقیقه
                    </p>
                    <p className="text-[13px] font-medium leading-7 text-slate-950">
                        {activeCard.persian}
                    </p>
                    <p dir="ltr" lang="zh" className="font-cjk mt-1 text-[15px] font-semibold leading-7 text-slate-900">
                        {activeCard.chinese}
                    </p>
                    <p dir="ltr" lang="zh-Latn" className="mt-1 text-[12px] font-medium leading-5 text-slate-800">
                        {activeCard.pinyin}
                    </p>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <button
                        type="button"
                        onClick={goPrevious}
                        disabled={!canGoPrevious}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-white/75 px-3 text-xs font-black text-[#155aa6] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronRight size={17} />
                        کمتر
                    </button>
                    <span className="text-center text-[11px] font-black text-slate-800">
                        {toPersianDigits(activeCard.minutes)} دقیقه
                    </span>
                    <button
                        type="button"
                        onClick={goNext}
                        disabled={!canGoNext}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-[#155aa6] px-3 text-xs font-black text-white shadow-[0_12px_24px_rgba(21,90,166,0.24)] transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:bg-white/55 disabled:text-[#155aa6]"
                    >
                        بیشتر
                        <ChevronLeft size={17} />
                    </button>
                </div>

                <div className="mt-4 rounded-[8px] bg-white/60 p-3">
                    <label htmlFor="customDailyMinutes" className="block text-right text-[12px] font-black text-slate-900">
                        سایر دقایق
                    </label>
                    <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                        <input
                            id="customDailyMinutes"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={300}
                            value={customMinutes}
                            onChange={(event) => setCustomMinutes(event.target.value)}
                            placeholder="مثلا ۲۵"
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
                    <p className="mt-2 text-right text-[11px] font-bold leading-5 text-slate-700">
                        اگر زمان دلخواهت بین پله‌های بالا نیست، اینجا عددش را وارد کن.
                    </p>
                </div>
            </div>
        </Surface>
    );
}

function PracticeProgress({ progress, onSelect }: { progress: number; onSelect: (value: number) => void }) {
    const progressWidth = `${Math.min(Math.max(progress, 0), 100)}%`;
    const markerPosition = `clamp(22px, ${progressWidth}, calc(100% - 22px))`;
    const dots = Array.from({ length: 11 });

    return (
        <div dir="ltr" className="relative h-[62px] px-2 pt-8">
            <div
                className="absolute top-3 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-[#155aa6] text-xs font-black text-white shadow-[0_12px_22px_rgba(21,90,166,0.24)] transition-all duration-500"
                style={{ left: markerPosition }}
            >
                {progress}
            </div>
            <div
                className="absolute top-[40px] z-10 h-[36px] w-[2px] -translate-x-1/2 bg-[#155aa6] transition-all duration-500"
                style={{ left: markerPosition }}
            />
            <div className="relative h-[13px] overflow-hidden rounded-full bg-[#a8d8f2]">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#155aa6] transition-all duration-500"
                    style={{ width: progressWidth }}
                />
                <div className="absolute inset-x-4 inset-y-0 grid grid-cols-[repeat(11,minmax(0,1fr))] items-center">
                    {dots.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onSelect(index * 10)}
                            className={cn(
                                "mx-auto h-[7px] w-[7px] rounded-full transition-colors duration-500",
                                index * 10 <= progress ? "bg-white" : "bg-slate-700",
                            )}
                            aria-label={`${index * 10} دقیقه`}
                        />
                    ))}
                </div>
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
