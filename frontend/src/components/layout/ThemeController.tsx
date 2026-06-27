"use client";

import { useEffect } from "react";
import {
    LEARNING_PREFERENCES_EVENT,
    LEARNING_PREFERENCES_STORAGE_KEY,
    type ThemePreference,
} from "@/lib/learningPreferences";

const readThemePreference = (): ThemePreference => {
    try {
        const rawValue = window.localStorage.getItem(LEARNING_PREFERENCES_STORAGE_KEY);
        if (!rawValue) return "light";
        const value = JSON.parse(rawValue) as { theme?: unknown };
        return value.theme === "dark" || value.theme === "system" || value.theme === "light"
            ? value.theme
            : "light";
    } catch {
        return "light";
    }
};

const applyTheme = (preference: ThemePreference, systemDark: boolean) => {
    const isDark = preference === "dark" || (preference === "system" && systemDark);
    const root = document.documentElement;

    root.classList.toggle("dark", isDark);
    root.classList.add("theme-ready");
    root.dataset.theme = isDark ? "dark" : "light";
    root.style.colorScheme = isDark ? "dark" : "light";

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = isDark ? "#10151c" : "#f7f8fb";
};

export default function ThemeController() {
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const syncTheme = () => applyTheme(readThemePreference(), mediaQuery.matches);

        syncTheme();
        mediaQuery.addEventListener("change", syncTheme);
        window.addEventListener("storage", syncTheme);
        window.addEventListener(LEARNING_PREFERENCES_EVENT, syncTheme);

        return () => {
            mediaQuery.removeEventListener("change", syncTheme);
            window.removeEventListener("storage", syncTheme);
            window.removeEventListener(LEARNING_PREFERENCES_EVENT, syncTheme);
        };
    }, []);

    return null;
}
