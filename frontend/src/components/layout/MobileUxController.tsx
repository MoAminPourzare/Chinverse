"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    calculateKeyboardInset,
    isStandaloneMode,
    recordInAppNavigation,
} from "@/lib/mobileUx";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export default function MobileUxController() {
    const pathname = usePathname();

    useEffect(() => {
        recordInAppNavigation(`${window.location.pathname}${window.location.search}`);
    }, [pathname]);

    useEffect(() => {
        const root = document.documentElement;
        const viewport = window.visualViewport;
        const standaloneQuery = window.matchMedia("(display-mode: standalone)");

        const syncViewport = () => {
            const visualHeight = viewport?.height ?? window.innerHeight;
            const offsetTop = viewport?.offsetTop ?? 0;
            const keyboardInset = calculateKeyboardInset(window.innerHeight, visualHeight, offsetTop);
            root.style.setProperty("--app-visual-height", `${Math.round(visualHeight)}px`);
            root.style.setProperty("--app-visual-offset-top", `${Math.round(offsetTop)}px`);
            root.style.setProperty("--app-keyboard-inset", `${keyboardInset}px`);
            root.dataset.keyboard = keyboardInset >= 120 ? "open" : "closed";
        };

        const syncEnvironment = () => {
            const width = viewport?.width ?? window.innerWidth;
            const height = viewport?.height ?? window.innerHeight;
            root.dataset.orientation = width > height
                ? "landscape"
                : "portrait";
            root.dataset.standalone = isStandaloneMode(
                standaloneQuery.matches,
                Boolean((navigator as NavigatorWithStandalone).standalone),
            ) ? "true" : "false";
        };

        const keepFocusedControlVisible = (event: FocusEvent) => {
            const target = event.target;
            if (!(target instanceof HTMLElement) || !target.matches("input, textarea, select, [contenteditable='true']")) return;
            window.setTimeout(() => target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }), 180);
        };

        syncViewport();
        syncEnvironment();
        viewport?.addEventListener("resize", syncViewport);
        viewport?.addEventListener("scroll", syncViewport);
        window.addEventListener("resize", syncViewport);
        window.addEventListener("resize", syncEnvironment);
        window.addEventListener("orientationchange", syncEnvironment);
        standaloneQuery.addEventListener("change", syncEnvironment);
        document.addEventListener("focusin", keepFocusedControlVisible);

        return () => {
            viewport?.removeEventListener("resize", syncViewport);
            viewport?.removeEventListener("scroll", syncViewport);
            window.removeEventListener("resize", syncViewport);
            window.removeEventListener("resize", syncEnvironment);
            window.removeEventListener("orientationchange", syncEnvironment);
            standaloneQuery.removeEventListener("change", syncEnvironment);
            document.removeEventListener("focusin", keepFocusedControlVisible);
        };
    }, []);

    return null;
}
