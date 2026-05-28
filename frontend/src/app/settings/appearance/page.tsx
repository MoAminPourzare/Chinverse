"use client";

import Image from "next/image";
import { RotateCcw } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { AppHeader } from "@/components/ui/IconButton";
import {
    OptionSheet,
    SelectSettingRow,
    SwitchSettingRow,
    useOptionSheet,
} from "@/components/settings/SettingsControls";
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

export default function AppearanceSettingsPage() {
    const { preferences, setPreference, resetPreferences } = useLearningPreferences();
    const { activeSheet, openSheet, closeSheet } = useOptionSheet();

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <AppHeader
                title="تنظیمات نگارشی"
                backHref="/settings"
                iconClassName="bg-transparent shadow-none ring-0"
                icon={<Image src="/assets/chinverse/icons/Preferences 2.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" />}
            />

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
