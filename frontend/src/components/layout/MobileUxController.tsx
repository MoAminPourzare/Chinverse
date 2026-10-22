"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
    calculateKeyboardInset,
    installInAppNavigationTracking,
    isDefaultViewportScale,
    isEditableElement,
    isSoftwareKeyboardOpen,
    isStandaloneMode,
    recordInAppNavigation,
} from "@/lib/mobileUx";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export default function MobileUxController() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.toString();
    const previousPathnameRef = useRef(pathname);

    useEffect(() => installInAppNavigationTracking(), []);

    useEffect(() => {
        recordInAppNavigation(
            `${window.location.pathname}${window.location.search}${window.location.hash}`,
        );
    }, [pathname, search]);

    useEffect(() => {
        const announcer = document.createElement("div");
        announcer.id = "chinverse-route-announcer";
        announcer.setAttribute("role", "status");
        announcer.setAttribute("aria-live", "polite");
        announcer.setAttribute("aria-atomic", "true");
        Object.assign(announcer.style, {
            position: "fixed",
            width: "1px",
            height: "1px",
            padding: "0",
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: "0",
        });
        document.body.appendChild(announcer);
        return () => announcer.remove();
    }, []);

    useEffect(() => {
        const previousPathname = previousPathnameRef.current;
        previousPathnameRef.current = pathname;
        if (previousPathname === pathname) return;

        let secondFrame = 0;
        let announcementTimer = 0;
        const firstFrame = window.requestAnimationFrame(() => {
            secondFrame = window.requestAnimationFrame(() => {
                const activePanel = Array.from(document.querySelectorAll<HTMLElement>(
                    ".route-panel[data-phase='enter']",
                )).at(-1);
                const scope = activePanel ?? document.body;
                const target = scope.querySelector<HTMLElement>(
                    "[data-route-focus], main h1, [role='main'] h1, h1, main, [role='main']",
                );
                const label = (target?.textContent?.trim() || document.title || "صفحه جدید")
                    .replace(/\s+/g, " ")
                    .slice(0, 140);
                const announcer = document.getElementById("chinverse-route-announcer");
                if (announcer) {
                    announcer.textContent = "";
                    announcementTimer = window.setTimeout(() => {
                        announcer.textContent = label;
                    }, 20);
                }

                const activeElement = document.activeElement as HTMLElement | null;
                const focusCanMove = !activeElement
                    || activeElement === document.body
                    || !activeElement.isConnected
                    || Boolean(activeElement.closest(".bottom-nav-container"));
                if (!target || !focusCanMove) return;
                const previousTabIndex = target.getAttribute("tabindex");
                target.setAttribute("tabindex", "-1");
                target.focus({ preventScroll: true });
                if (previousTabIndex === null) {
                    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
                }
            });
        });

        return () => {
            window.cancelAnimationFrame(firstFrame);
            window.cancelAnimationFrame(secondFrame);
            window.clearTimeout(announcementTimer);
        };
    }, [pathname]);

    useEffect(() => {
        const root = document.documentElement;
        const viewport = window.visualViewport;
        const standaloneQuery = window.matchMedia("(display-mode: standalone)");

        const syncViewport = () => {
            const visualHeight = viewport?.height ?? window.innerHeight;
            const offsetTop = viewport?.offsetTop ?? 0;
            const viewportScale = viewport?.scale ?? 1;
            const rawKeyboardInset = calculateKeyboardInset(window.innerHeight, visualHeight, offsetTop);
            const keyboardOpen = isSoftwareKeyboardOpen(
                rawKeyboardInset,
                isEditableElement(document.activeElement),
                viewportScale,
            );
            const pinchZoomed = !isDefaultViewportScale(viewportScale);
            const keyboardInset = keyboardOpen ? rawKeyboardInset : 0;
            root.style.setProperty(
                "--app-visual-height",
                `${Math.round(pinchZoomed ? window.innerHeight : visualHeight)}px`,
            );
            root.style.setProperty(
                "--app-visual-offset-top",
                `${Math.round(pinchZoomed ? 0 : offsetTop)}px`,
            );
            root.style.setProperty("--app-keyboard-inset", `${keyboardInset}px`);
            root.dataset.keyboard = keyboardOpen ? "open" : "closed";
        };

        const syncEnvironment = () => {
            const useVisualViewport = isDefaultViewportScale(viewport?.scale ?? 1);
            const width = useVisualViewport ? viewport?.width ?? window.innerWidth : window.innerWidth;
            const height = useVisualViewport ? viewport?.height ?? window.innerHeight : window.innerHeight;
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
