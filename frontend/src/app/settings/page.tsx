"use client";

import { useState } from "react";
import { ArrowRight, Check, ChevronLeft, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Surface from "@/components/ui/Surface";
import {
    chineseFontSizeOptions,
    chineseLineSpacingOptions,
    fontSizeOptions,
    highlightColorOptions,
    lineSpacingOptions,
    playbackSpeedOptions,
    textDisplayModeOptions,
    useLearningPreferences,
    type FontSizeLevel,
    type HighlightColor,
    type LineSpacingLevel,
    type TextDisplayMode,
} from "@/lib/learningPreferences";

type SettingOption = {
    value: string;
    label: string;
    swatch?: string;
    description?: string;
};

type ActiveSheet = {
    id: string;
    title: string;
    subtitle: string;
    value: string;
    options: SettingOption[];
    onSelect: (value: string) => void;
};

export default function SettingsPage() {
    const router = useRouter();
    const { preferences, setPreference, resetPreferences } = useLearningPreferences();
    const [activeSheet, setActiveSheet] = useState<ActiveSheet | null>(null);

    const openSheet = (sheet: ActiveSheet) => setActiveSheet(sheet);
    const closeSheet = () => setActiveSheet(null);

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <header className="sticky top-3 z-40 mb-5 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100"
                    aria-label="بازگشت"
                >
                    <ArrowRight size={22} />
                </button>
                <div className="text-center">
                    <h1 className="text-base font-black text-slate-950">تنظیمات دلخواه</h1>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">نمایش، متن و پخش درس‌ها</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-rose-50 text-blue-700">
                    <SlidersHorizontal size={23} />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <Surface className="overflow-hidden border-white bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                    <div className="divide-y divide-slate-100">
                        <SelectSettingRow
                            label="سایز متن فارسی"
                            value={preferences.persianFontSize}
                            options={fontSizeOptions}
                            onOpen={(value, options) => openSheet({
                                id: "persianFontSize",
                                title: "سایز متن فارسی",
                                subtitle: "اندازه ترجمه‌ها و توضیحات فارسی در درس‌ها",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("persianFontSize", nextValue as FontSizeLevel),
                            })}
                        />
                        <SelectSettingRow
                            label="سایز متن چینی"
                            value={preferences.chineseFontSize}
                            options={chineseFontSizeOptions}
                            onOpen={(value, options) => openSheet({
                                id: "chineseFontSize",
                                title: "سایز متن چینی",
                                subtitle: "اندازه جمله‌ها، کاراکترها و متن چینی",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("chineseFontSize", nextValue as FontSizeLevel),
                            })}
                        />
                        <SelectSettingRow
                            label="فاصله بین خطوط فارسی"
                            value={preferences.persianLineSpacing}
                            options={lineSpacingOptions}
                            onOpen={(value, options) => openSheet({
                                id: "persianLineSpacing",
                                title: "فاصله خطوط فارسی",
                                subtitle: "برای خواندن راحت‌تر ترجمه و توضیحات فارسی",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("persianLineSpacing", nextValue as LineSpacingLevel),
                            })}
                        />
                        <SelectSettingRow
                            label="فاصله بین خطوط چینی"
                            value={preferences.chineseLineSpacing}
                            options={chineseLineSpacingOptions}
                            onOpen={(value, options) => openSheet({
                                id: "chineseLineSpacing",
                                title: "فاصله خطوط چینی",
                                subtitle: "برای بهتر دیدن کاراکترهای چینی و مثال‌ها",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("chineseLineSpacing", nextValue as LineSpacingLevel),
                            })}
                        />
                        <SelectSettingRow
                            label="سرعت پخش محتوا"
                            value={String(preferences.playbackSpeed)}
                            options={playbackSpeedOptions.map((option) => ({
                                value: String(option.value),
                                label: option.label,
                            }))}
                            onOpen={(value, options) => openSheet({
                                id: "playbackSpeed",
                                title: "سرعت پخش محتوا",
                                subtitle: "سرعت ویدیوهای آموزشی را تنظیم کن",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("playbackSpeed", Number(nextValue)),
                            })}
                        />
                        <SelectSettingRow
                            label="شیوه نمایش متن"
                            value={preferences.textDisplayMode}
                            options={textDisplayModeOptions}
                            onOpen={(value, options) => openSheet({
                                id: "textDisplayMode",
                                title: "شیوه نمایش متن",
                                subtitle: "انتخاب کن متن درس چطور نمایش داده شود",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("textDisplayMode", nextValue as TextDisplayMode),
                            })}
                        />
                        <SelectSettingRow
                            label="رنگ هایلایت لغات جدید"
                            value={preferences.newWordHighlightColor}
                            options={highlightColorOptions}
                            swatches
                            onOpen={(value, options) => openSheet({
                                id: "newWordHighlightColor",
                                title: "رنگ هایلایت لغات جدید",
                                subtitle: "رنگ واژه‌های قابل لمس داخل متن درس",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("newWordHighlightColor", nextValue as HighlightColor),
                            })}
                        />
                        <SelectSettingRow
                            label="رنگ هایلایت لغات لایتنر"
                            value={preferences.leitnerHighlightColor}
                            options={highlightColorOptions}
                            swatches
                            onOpen={(value, options) => openSheet({
                                id: "leitnerHighlightColor",
                                title: "رنگ هایلایت لغات لایتنر",
                                subtitle: "رنگ واژه‌های مهم هنگام مرور کارت‌ها",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("leitnerHighlightColor", nextValue as HighlightColor),
                            })}
                        />
                        <SwitchSettingRow
                            label="نمایش پین یین"
                            checked={preferences.showPinyin}
                            onChange={(checked) => setPreference("showPinyin", checked)}
                        />
                        <SwitchSettingRow
                            label="پخش خودکار محتوای بعدی"
                            checked={preferences.autoplayNext}
                            onChange={(checked) => setPreference("autoplayNext", checked)}
                        />
                    </div>
                </Surface>

                <Surface className="bg-white/90 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                            <SlidersHorizontal size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-black text-slate-950">این تنظیمات کجا اثر می‌گذارد؟</h2>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                                روی صفحه تماشای درس، متن فارسی و چینی، هایلایت واژه‌ها، نمایش پین‌یین، سرعت ویدیو و مرور لایتنر اعمال می‌شود.
                            </p>
                        </div>
                    </div>
                </Surface>

                <button
                    type="button"
                    onClick={resetPreferences}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <RotateCcw size={17} />
                    بازگشت به حالت پیش‌فرض
                </button>
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

interface SelectSettingRowProps {
    label: string;
    value: string;
    options: SettingOption[];
    onOpen: (value: string, options: SettingOption[]) => void;
    swatches?: boolean;
}

function SelectSettingRow({ label, value, options, onOpen, swatches = false }: SelectSettingRowProps) {
    const activeOption = options.find((option) => option.value === value) || options[0];

    return (
        <button
            type="button"
            onClick={() => onOpen(value, options)}
            className="flex min-h-[62px] w-full items-center justify-between gap-3 px-4 py-3 text-right transition hover:bg-slate-50/80 active:bg-slate-100"
        >
            <span className="text-sm font-black text-slate-800">{label}</span>
            <span className="flex min-w-0 items-center gap-2 text-left">
                {swatches && activeOption?.swatch && (
                    <span
                        className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white shadow"
                        style={{ backgroundColor: activeOption.swatch }}
                    />
                )}
                <span className="max-w-[130px] truncate text-xs font-bold text-slate-500">{activeOption?.label}</span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-blue-700" />
            </span>
        </button>
    );
}

interface SwitchSettingRowProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function SwitchSettingRow({ label, checked, onChange }: SwitchSettingRowProps) {
    return (
        <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-black text-slate-800">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative h-8 w-14 rounded-full p-1 transition ${
                    checked ? "bg-blue-700" : "bg-slate-300"
                }`}
                aria-pressed={checked}
                aria-label={label}
            >
                <span
                    className={`block h-6 w-6 rounded-full bg-white shadow transition ${
                        checked ? "-translate-x-6" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
    );
}

function OptionSheet({ sheet, onClose }: { sheet: ActiveSheet; onClose: () => void }) {
    const handleSelect = (value: string) => {
        sheet.onSelect(value);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 px-3 pb-3 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-[430px] overflow-hidden rounded-[34px] border border-white/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
                onClick={(event) => event.stopPropagation()}
                dir="rtl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="text-base font-black text-slate-950">{sheet.title}</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{sheet.subtitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                        aria-label="بستن"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="max-h-[58vh] overflow-y-auto p-3">
                    <div className="space-y-2">
                        {sheet.options.map((option) => {
                            const active = option.value === sheet.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`flex w-full items-center justify-between gap-3 rounded-[24px] border px-4 py-3 text-right transition ${
                                        active
                                            ? "border-blue-100 bg-blue-50 text-blue-800 shadow-[0_12px_28px_rgba(37,99,235,0.12)]"
                                            : "border-slate-100 bg-slate-50/70 text-slate-700 hover:bg-white"
                                    }`}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        {option.swatch && (
                                            <span
                                                className="h-7 w-7 shrink-0 rounded-2xl ring-4 ring-white shadow"
                                                style={{ backgroundColor: option.swatch }}
                                            />
                                        )}
                                        <span className="min-w-0">
                                            <span className="block text-sm font-black">{option.label}</span>
                                            {option.description && (
                                                <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                                            )}
                                        </span>
                                    </span>
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${
                                        active ? "bg-blue-700 text-white" : "bg-white text-slate-300"
                                    }`}>
                                        {active && <Check size={17} />}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
