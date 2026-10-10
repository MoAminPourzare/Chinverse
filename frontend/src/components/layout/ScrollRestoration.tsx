"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Next restores the window; the app scrolls inside its own viewport instead. */
export default function ScrollRestoration({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
    const pathname = usePathname();
    const search = useSearchParams().toString();
    const key = `${pathname}${search ? `?${search}` : ""}`;
    const positions = useRef(new Map<string, number>());

    useLayoutEffect(() => {
        const scroll = scrollRef.current;
        if (!scroll) return;
        const target = positions.current.get(key) || 0;
        let restoring = true;
        const remember = () => {
            if (!restoring) positions.current.set(key, scroll.scrollTop);
        };
        const restore = () => {
            const header = scroll.querySelector<HTMLElement>('.route-panel[data-phase="enter"] [data-page-header]');
            scroll.style.setProperty("--app-header-height", `${header?.offsetHeight || 0}px`);
            if (!restoring) return;
            scroll.scrollTo({ top: target, left: 0, behavior: "instant" });
            // Wait for asynchronous content before accepting a clamped position.
            if (Math.abs(scroll.scrollTop - target) < 2) restoring = false;
        };
        const cancel = () => { restoring = false; remember(); };
        restore();
        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(restore);
        if (scroll.firstElementChild) observer?.observe(scroll.firstElementChild);
        scroll.addEventListener("scroll", remember, { passive: true });
        scroll.addEventListener("click", remember, true);
        scroll.addEventListener("wheel", cancel, { passive: true });
        scroll.addEventListener("touchstart", cancel, { passive: true });
        scroll.addEventListener("keydown", cancel);
        return () => {
            observer?.disconnect();
            scroll.removeEventListener("scroll", remember);
            scroll.removeEventListener("click", remember, true);
            scroll.removeEventListener("wheel", cancel);
            scroll.removeEventListener("touchstart", cancel);
            scroll.removeEventListener("keydown", cancel);
        };
    }, [key, scrollRef]);

    return null;
}
