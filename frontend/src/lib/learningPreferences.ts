"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

export type FontSizeLevel = "small" | "normal" | "large" | "xlarge";
export type LineSpacingLevel = "compact" | "normal" | "relaxed" | "loose";
export type TextDisplayMode = "mixed" | "persian" | "chinese";
export type HighlightColor = "amber" | "rose" | "sky" | "emerald" | "violet";

export interface LearningPreferences {
    persianFontSize: FontSizeLevel;
    chineseFontSize: FontSizeLevel;
    persianLineSpacing: LineSpacingLevel;
    chineseLineSpacing: LineSpacingLevel;
    playbackSpeed: number;
    textDisplayMode: TextDisplayMode;
    newWordHighlightColor: HighlightColor;
    leitnerHighlightColor: HighlightColor;
    showPinyin: boolean;
    autoplayNext: boolean;
}

export const LEARNING_PREFERENCES_STORAGE_KEY = "chinverse.learningPreferences.v1";
export const LEARNING_PREFERENCES_EVENT = "chinverse-learning-preferences-change";

export const defaultLearningPreferences: LearningPreferences = {
    persianFontSize: "normal",
    chineseFontSize: "normal",
    persianLineSpacing: "relaxed",
    chineseLineSpacing: "relaxed",
    playbackSpeed: 1,
    textDisplayMode: "mixed",
    newWordHighlightColor: "amber",
    leitnerHighlightColor: "sky",
    showPinyin: true,
    autoplayNext: true,
};

export const fontSizeOptions: Array<{ value: FontSizeLevel; label: string }> = [
    { value: "small", label: "کوچک" },
    { value: "normal", label: "متوسط/معمولی" },
    { value: "large", label: "بزرگ" },
    { value: "xlarge", label: "خیلی بزرگ" },
];

export const chineseFontSizeOptions: Array<{ value: FontSizeLevel; label: string }> = [
    { value: "small", label: "小" },
    { value: "normal", label: "中، نرمال" },
    { value: "large", label: "大، بزرگ" },
    { value: "xlarge", label: "超大" },
];

export const lineSpacingOptions: Array<{ value: LineSpacingLevel; label: string }> = [
    { value: "compact", label: "کم" },
    { value: "normal", label: "معمولی" },
    { value: "relaxed", label: "زیاد" },
    { value: "loose", label: "خیلی زیاد" },
];

export const chineseLineSpacingOptions: Array<{ value: LineSpacingLevel; label: string }> = [
    { value: "compact", label: "紧凑" },
    { value: "normal", label: "正常" },
    { value: "relaxed", label: "宽松" },
    { value: "loose", label: "很宽松" },
];

export const playbackSpeedOptions = [
    { value: 0.75, label: "x0.75" },
    { value: 1, label: "x1 (عادی)" },
    { value: 1.25, label: "x1.25" },
    { value: 1.5, label: "x1.5" },
    { value: 2, label: "x2" },
];

export const textDisplayModeOptions: Array<{ value: TextDisplayMode; label: string }> = [
    { value: "mixed", label: "فارسی و چینی" },
    { value: "chinese", label: "فقط چینی" },
    { value: "persian", label: "فقط فارسی" },
];

export const highlightColorOptions: Array<{ value: HighlightColor; label: string; swatch: string }> = [
    { value: "amber", label: "نارنجی", swatch: "#f59e0b" },
    { value: "rose", label: "قرمز ملایم", swatch: "#f43f5e" },
    { value: "sky", label: "آبی", swatch: "#0ea5e9" },
    { value: "emerald", label: "سبز", swatch: "#10b981" },
    { value: "violet", label: "بنفش", swatch: "#8b5cf6" },
];

const fontSizeMap: Record<FontSizeLevel, number> = {
    small: 14,
    normal: 16,
    large: 18,
    xlarge: 21,
};

const chineseFontSizeMap: Record<FontSizeLevel, number> = {
    small: 18,
    normal: 21,
    large: 24,
    xlarge: 28,
};

const lineHeightMap: Record<LineSpacingLevel, number> = {
    compact: 1.45,
    normal: 1.7,
    relaxed: 2,
    loose: 2.25,
};

const highlightStyleMap: Record<HighlightColor, CSSProperties> = {
    amber: { backgroundColor: "#fde68a", color: "#78350f" },
    rose: { backgroundColor: "#fecdd3", color: "#881337" },
    sky: { backgroundColor: "#bae6fd", color: "#0c4a6e" },
    emerald: { backgroundColor: "#a7f3d0", color: "#064e3b" },
    violet: { backgroundColor: "#ddd6fe", color: "#4c1d95" },
};

const isOptionValue = <T extends string>(value: unknown, options: Array<{ value: T }>): value is T => {
    return typeof value === "string" && options.some((option) => option.value === value);
};

const sanitizePreferences = (value: unknown): LearningPreferences => {
    if (!value || typeof value !== "object") {
        return defaultLearningPreferences;
    }

    const input = value as Partial<LearningPreferences>;
    return {
        ...defaultLearningPreferences,
        persianFontSize: isOptionValue(input.persianFontSize, fontSizeOptions)
            ? input.persianFontSize
            : defaultLearningPreferences.persianFontSize,
        chineseFontSize: isOptionValue(input.chineseFontSize, chineseFontSizeOptions)
            ? input.chineseFontSize
            : defaultLearningPreferences.chineseFontSize,
        persianLineSpacing: isOptionValue(input.persianLineSpacing, lineSpacingOptions)
            ? input.persianLineSpacing
            : defaultLearningPreferences.persianLineSpacing,
        chineseLineSpacing: isOptionValue(input.chineseLineSpacing, chineseLineSpacingOptions)
            ? input.chineseLineSpacing
            : defaultLearningPreferences.chineseLineSpacing,
        playbackSpeed: playbackSpeedOptions.some((option) => option.value === input.playbackSpeed)
            ? Number(input.playbackSpeed)
            : defaultLearningPreferences.playbackSpeed,
        textDisplayMode: isOptionValue(input.textDisplayMode, textDisplayModeOptions)
            ? input.textDisplayMode
            : defaultLearningPreferences.textDisplayMode,
        newWordHighlightColor: isOptionValue(input.newWordHighlightColor, highlightColorOptions)
            ? input.newWordHighlightColor
            : defaultLearningPreferences.newWordHighlightColor,
        leitnerHighlightColor: isOptionValue(input.leitnerHighlightColor, highlightColorOptions)
            ? input.leitnerHighlightColor
            : defaultLearningPreferences.leitnerHighlightColor,
        showPinyin: typeof input.showPinyin === "boolean" ? input.showPinyin : defaultLearningPreferences.showPinyin,
        autoplayNext: typeof input.autoplayNext === "boolean" ? input.autoplayNext : defaultLearningPreferences.autoplayNext,
    };
};

export const getStoredLearningPreferences = (): LearningPreferences => {
    if (typeof window === "undefined") {
        return defaultLearningPreferences;
    }

    try {
        const rawValue = window.localStorage.getItem(LEARNING_PREFERENCES_STORAGE_KEY);
        return sanitizePreferences(rawValue ? JSON.parse(rawValue) : null);
    } catch {
        return defaultLearningPreferences;
    }
};

export const saveLearningPreferences = (preferences: LearningPreferences) => {
    if (typeof window === "undefined") return;

    const nextPreferences = sanitizePreferences(preferences);
    window.localStorage.setItem(LEARNING_PREFERENCES_STORAGE_KEY, JSON.stringify(nextPreferences));
    window.dispatchEvent(new CustomEvent(LEARNING_PREFERENCES_EVENT, { detail: nextPreferences }));
};

export const useLearningPreferences = () => {
    const [preferences, setPreferences] = useState<LearningPreferences>(defaultLearningPreferences);

    useEffect(() => {
        const syncPreferences = () => setPreferences(getStoredLearningPreferences());
        syncPreferences();

        window.addEventListener("storage", syncPreferences);
        window.addEventListener(LEARNING_PREFERENCES_EVENT, syncPreferences);
        return () => {
            window.removeEventListener("storage", syncPreferences);
            window.removeEventListener(LEARNING_PREFERENCES_EVENT, syncPreferences);
        };
    }, []);

    const updatePreferences = useCallback((nextPreferences: LearningPreferences) => {
        setPreferences(nextPreferences);
        saveLearningPreferences(nextPreferences);
    }, []);

    const setPreference = useCallback(<K extends keyof LearningPreferences>(
        key: K,
        value: LearningPreferences[K],
    ) => {
        setPreferences((currentPreferences) => {
            const nextPreferences = { ...currentPreferences, [key]: value };
            saveLearningPreferences(nextPreferences);
            return nextPreferences;
        });
    }, []);

    const resetPreferences = useCallback(() => {
        updatePreferences(defaultLearningPreferences);
    }, [updatePreferences]);

    return {
        preferences,
        setPreference,
        updatePreferences,
        resetPreferences,
    };
};

export const getPersianTextStyle = (preferences: LearningPreferences): CSSProperties => ({
    fontSize: `${fontSizeMap[preferences.persianFontSize]}px`,
    lineHeight: lineHeightMap[preferences.persianLineSpacing],
});

export const getChineseTextStyle = (preferences: LearningPreferences): CSSProperties => ({
    fontSize: `${chineseFontSizeMap[preferences.chineseFontSize]}px`,
    lineHeight: lineHeightMap[preferences.chineseLineSpacing],
});

export const getHighlightStyle = (color: HighlightColor): CSSProperties => ({
    ...highlightStyleMap[color],
    borderRadius: "0.4rem",
});
