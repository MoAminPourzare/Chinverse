"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { RotateCcw, X } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { AppHeader } from "@/components/ui/IconButton";
import {
    OptionSheet,
    SelectSettingRow,
    SwitchSettingRow,
    useOptionSheet,
} from "@/components/settings/SettingsControls";
import { cn } from "@/lib/cn";
import {
    highlightColorOptions,
    playbackSpeedOptions,
    themeOptions,
    textDisplayModeOptions,
    useLearningPreferences,
    type FontSizeLevel,
    type HighlightColor,
    type LineSpacingLevel,
    type ThemePreference,
    type TextDisplayMode,
} from "@/lib/learningPreferences";

type ScaleOption<T extends string> = {
    value: T;
    label: string;
};

type VisualSettingId = "persianFontSize" | "chineseFontSize" | "persianLineSpacing" | "chineseLineSpacing";

const persianFontLabels: Array<ScaleOption<FontSizeLevel>> = [
    { value: "small", label: "کوچک" },
    { value: "normal", label: "متوسط" },
    { value: "large", label: "بزرگ" },
    { value: "xlarge", label: "خیلی بزرگ" },
];

const chineseFontLabels: Array<ScaleOption<FontSizeLevel>> = [
    { value: "small", label: "小号" },
    { value: "normal", label: "中号" },
    { value: "large", label: "大号" },
    { value: "xlarge", label: "特大号" },
];

const persianLineLabels: Array<ScaleOption<LineSpacingLevel>> = [
    { value: "compact", label: "کم" },
    { value: "normal", label: "معمولی" },
    { value: "relaxed", label: "زیاد" },
    { value: "loose", label: "خیلی زیاد" },
];

const chineseLineLabels: Array<ScaleOption<LineSpacingLevel>> = [
    { value: "compact", label: "紧凑" },
    { value: "normal", label: "适中" },
    { value: "relaxed", label: "宽松" },
    { value: "loose", label: "超宽" },
];

const persianFontPreview: Record<FontSizeLevel, CSSProperties> = {
    small: { fontSize: 12 },
    normal: { fontSize: 14 },
    large: { fontSize: 16 },
    xlarge: { fontSize: 18 },
};

const chineseFontPreview: Record<FontSizeLevel, CSSProperties> = {
    small: { fontSize: 16 },
    normal: { fontSize: 20 },
    large: { fontSize: 24 },
    xlarge: { fontSize: 30 },
};

const persianPreviewTextStyle: Record<FontSizeLevel, CSSProperties> = {
    small: { fontSize: 12, lineHeight: 1.85 },
    normal: { fontSize: 14, lineHeight: 1.95 },
    large: { fontSize: 16, lineHeight: 2 },
    xlarge: { fontSize: 18, lineHeight: 2.05 },
};

const chinesePreviewTextStyle: Record<FontSizeLevel, CSSProperties> = {
    small: { fontSize: 15, lineHeight: 1.75 },
    normal: { fontSize: 17, lineHeight: 1.85 },
    large: { fontSize: 20, lineHeight: 1.95 },
    xlarge: { fontSize: 23, lineHeight: 2.05 },
};

const lineSpacingPreview: Record<LineSpacingLevel, CSSProperties> = {
    compact: { lineHeight: 1.45 },
    normal: { lineHeight: 1.75 },
    relaxed: { lineHeight: 2.15 },
    loose: { lineHeight: 2.55 },
};

const persianPreviewText = "چین‌ورس یک اپلیکیشن جامع و چندمنظوره برای همه علاقه‌مندان به زبان و فرهنگ چینیه. اینجا جاییه که می‌تونی همزمان زبان چینی یاد بگیری، فیلم و سریال چینی ببینی، کتاب بخونی و با دنیای واقعی چین آشنا بشی.";
const chinesePreviewText = "中语宇宙（Chinverse）是一款全面而多功能的应用程序，专为所有对中文语言和文化感兴趣的人打造。在这里，你不仅可以学习中文，还能观看中文影视、阅读书籍，深入了解真实的中国世界。";

function VisualScaleSetting<T extends string>({
    title,
    value,
    options,
    onChange,
    previewText,
    previewLang,
    previewDir,
    previewClassName,
    previewStyle,
    labelStyle,
}: {
    title: string;
    value: T;
    options: Array<ScaleOption<T>>;
    onChange: (value: T) => void;
    previewText: string;
    previewLang: string;
    previewDir: "rtl" | "ltr";
    previewClassName?: string;
    previewStyle?: CSSProperties;
    labelStyle?: (value: T) => CSSProperties;
}) {
    const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
    const progress = options.length > 1 ? (activeIndex / (options.length - 1)) * 100 : 0;

    return (
        <section className="px-4 py-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-right text-sm font-black text-slate-900 dark:text-[#e8edf4]">
                    {title}
                </h2>
                <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6] dark:bg-[#1b3148] dark:text-[#8ec5ff]">
                    {options[activeIndex]?.label}
                </span>
            </div>

            <div className="relative px-1 pb-2 pt-1" dir="ltr">
                <div className="absolute left-3 right-3 top-[38px] h-1 rounded-full bg-slate-300 dark:bg-[#475466]" />
                <div
                    className="absolute left-3 top-[38px] h-1 rounded-full bg-[#ea8a66] transition-all duration-300"
                    style={{ right: `calc(100% - ${progress}%)` }}
                />
                <div className="relative grid grid-cols-4 gap-0">
                    {options.map((option) => {
                        const active = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onChange(option.value)}
                                className="group flex min-h-16 flex-col items-center justify-start gap-2 text-center"
                                aria-pressed={active}
                            >
                                <span
                                    className={cn(
                                        "min-h-7 text-xs font-black leading-7 text-slate-700 transition-colors dark:text-[#cad3df]",
                                        active && "text-[#e9815f] dark:text-[#f0a080]",
                                        previewClassName,
                                    )}
                                    style={labelStyle?.(option.value)}
                                >
                                    {option.label}
                                </span>
                                <span
                                    className={cn(
                                        "mt-0 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300",
                                        active
                                            ? "scale-110 bg-[#ea8a66] shadow-[0_8px_18px_rgba(234,138,102,0.35)]"
                                            : "scale-75 bg-slate-300 opacity-0 group-hover:opacity-70 dark:bg-[#5c6675]",
                                    )}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <p
                className={cn(
                    "mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-slate-700 dark:bg-[#111821] dark:text-[#d4dce7]",
                    previewClassName,
                )}
                dir={previewDir}
                lang={previewLang}
                style={previewStyle}
            >
                {previewText}
            </p>
        </section>
    );
}

function VisualScaleSheet({
    onClose,
    children,
}: {
    onClose: () => void;
    children: ReactNode;
}) {
    return (
        <div className="modal-backdrop-motion fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/45 px-0 pt-10 backdrop-blur-sm sm:items-center sm:px-3" onClick={onClose}>
            <div
                className="modal-panel-motion w-full max-w-[430px] overflow-hidden rounded-t-[30px] border border-white/80 bg-white shadow-[0_-18px_60px_rgba(15,23,42,0.24)] dark:border-[#344050] dark:bg-[#171d26] sm:rounded-[30px]"
                onClick={(event) => event.stopPropagation()}
                dir="rtl"
            >
                <div className="flex justify-start px-4 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d5e1ef] bg-white text-slate-500 shadow-sm transition hover:bg-[#eef6ff] hover:text-[#155aa6] dark:border-[#344050] dark:bg-[#202936] dark:text-[#c5ced9]"
                        aria-label="بستن"
                    >
                        <X size={19} />
                    </button>
                </div>
                <div className="max-h-[76vh] overflow-y-auto pb-5">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function AppearanceSettingsPage() {
    const { preferences, setPreference, resetPreferences } = useLearningPreferences();
    const { activeSheet, openSheet, closeSheet } = useOptionSheet();
    const [activeVisualSetting, setActiveVisualSetting] = useState<VisualSettingId | null>(null);

    const closeVisualSetting = () => setActiveVisualSetting(null);

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4 dark:bg-[#10151c]" dir="rtl">
            <AppHeader
                title="ظاهر و نمایش"
                backHref="/settings"
                iconClassName="bg-transparent shadow-none ring-0"
                icon={<Image src="/assets/chinverse/icons/Preferences 2.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" />}
            />

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <Surface className="overflow-hidden border-white bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-[#2b3542] dark:bg-[#171d26]/95 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
                    <div className="divide-y divide-slate-100 dark:divide-[#273141]">
                        <SelectSettingRow
                            label="حالت نمایش برنامه"
                            value={preferences.theme}
                            options={themeOptions}
                            onOpen={(value, options) => openSheet({
                                id: "theme",
                                title: "حالت نمایش برنامه",
                                subtitle: "ظاهر چین‌ورس را برای روز، شب یا تنظیمات دستگاه انتخاب کن",
                                value,
                                options,
                                onSelect: (nextValue) => setPreference("theme", nextValue as ThemePreference),
                            })}
                        />

                        <SelectSettingRow
                            label="سایز متن فارسی"
                            value={preferences.persianFontSize}
                            options={persianFontLabels}
                            onOpen={() => setActiveVisualSetting("persianFontSize")}
                        />

                        <SelectSettingRow
                            label="سایز متن چینی"
                            value={preferences.chineseFontSize}
                            options={chineseFontLabels}
                            onOpen={() => setActiveVisualSetting("chineseFontSize")}
                        />

                        <SelectSettingRow
                            label="فاصله بین خطوط فارسی"
                            value={preferences.persianLineSpacing}
                            options={persianLineLabels}
                            onOpen={() => setActiveVisualSetting("persianLineSpacing")}
                        />

                        <SelectSettingRow
                            label="فاصله بین خطوط چینی"
                            value={preferences.chineseLineSpacing}
                            options={chineseLineLabels}
                            onOpen={() => setActiveVisualSetting("chineseLineSpacing")}
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
                            label="نمایش پین‌یین"
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

                <button
                    type="button"
                    onClick={resetPreferences}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#344050] dark:bg-[#171d26] dark:text-[#c5ced9] dark:hover:bg-[#202936]"
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

            {activeVisualSetting && (
                <VisualScaleSheet onClose={closeVisualSetting}>
                    {activeVisualSetting === "persianFontSize" && (
                        <VisualScaleSetting
                            title="سایز متن فارسی"
                            value={preferences.persianFontSize}
                            options={persianFontLabels}
                            onChange={(nextValue) => setPreference("persianFontSize", nextValue)}
                            previewText={persianPreviewText}
                            previewLang="fa"
                            previewDir="rtl"
                            previewStyle={persianPreviewTextStyle[preferences.persianFontSize]}
                            labelStyle={(optionValue) => persianFontPreview[optionValue as FontSizeLevel]}
                        />
                    )}
                    {activeVisualSetting === "chineseFontSize" && (
                        <VisualScaleSetting
                            title="سایز متن چینی"
                            value={preferences.chineseFontSize}
                            options={chineseFontLabels}
                            onChange={(nextValue) => setPreference("chineseFontSize", nextValue)}
                            previewText={chinesePreviewText}
                            previewLang="zh-CN"
                            previewDir="ltr"
                            previewClassName="font-cjk"
                            previewStyle={chinesePreviewTextStyle[preferences.chineseFontSize]}
                            labelStyle={(optionValue) => chineseFontPreview[optionValue as FontSizeLevel]}
                        />
                    )}
                    {activeVisualSetting === "persianLineSpacing" && (
                        <VisualScaleSetting
                            title="فاصله بین خطوط فارسی"
                            value={preferences.persianLineSpacing}
                            options={persianLineLabels}
                            onChange={(nextValue) => setPreference("persianLineSpacing", nextValue)}
                            previewText={persianPreviewText}
                            previewLang="fa"
                            previewDir="rtl"
                            previewStyle={{ fontSize: 13, ...lineSpacingPreview[preferences.persianLineSpacing] }}
                        />
                    )}
                    {activeVisualSetting === "chineseLineSpacing" && (
                        <VisualScaleSetting
                            title="فاصله بین خطوط چینی"
                            value={preferences.chineseLineSpacing}
                            options={chineseLineLabels}
                            onChange={(nextValue) => setPreference("chineseLineSpacing", nextValue)}
                            previewText={chinesePreviewText}
                            previewLang="zh-CN"
                            previewDir="ltr"
                            previewClassName="font-cjk"
                            previewStyle={{ fontSize: 16, ...lineSpacingPreview[preferences.chineseLineSpacing] }}
                        />
                    )}
                </VisualScaleSheet>
            )}
        </div>
    );
}
