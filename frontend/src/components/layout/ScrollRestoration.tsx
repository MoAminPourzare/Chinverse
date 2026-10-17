"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Next restores the window; the app scrolls inside its own viewport instead. */
export default function ScrollRestoration({ scroll }: { scroll: HTMLDivElement | null }) {
    const pathname = usePathname();
    const search = useSearchParams().toString();
    const key = `${pathname}${search ? `?${search}` : ""}`;
    const positions = useRef(new Map<string, number>());

    useLayoutEffect(() => {
        if (!scroll) return;
        const target = positions.current.get(key) || 0;
        let restoring = true;
        let observedHeader: HTMLElement | null = null;
        const remember = () => {
            if (!restoring) positions.current.set(key, scroll.scrollTop);
        };
        const restore = () => {
            const header = scroll.querySelector<HTMLElement>('.route-panel[data-phase="enter"] [data-page-header]');
            if (header) {
                // Measure its normal layout position, independent of scroll and route transforms.
                // Using top:0 would consume the page's initial top padding before it sticks.
                const position = header.style.position;
                header.style.position = "static";
                let top = 0;
                let ancestor: HTMLElement | null = header;
                while (ancestor && ancestor !== scroll) {
                    top += ancestor.offsetTop;
                    ancestor = ancestor.offsetParent as HTMLElement | null;
                }
                header.style.position = position;
                header.style.setProperty("--app-header-top", `${top}px`);
                scroll.style.setProperty("--app-header-height", `${top + header.offsetHeight}px`);
                if (observedHeader !== header) {
                    if (observedHeader) observer?.unobserve(observedHeader);
                    observedHeader = header;
                    observer?.observe(header);
                }
            } else {
                scroll.style.setProperty("--app-header-height", "0px");
            }
            if (!restoring) return;
            scroll.scrollTo({ top: target, left: 0, behavior: "instant" });
            // Wait for asynchronous content before accepting a clamped position.
            if (Math.abs(scroll.scrollTop - target) < 2) restoring = false;
        };
        const cancel = () => { restoring = false; remember(); };
        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(restore);
        restore();
        if (scroll.firstElementChild) observer?.observe(scroll.firstElementChild);
        const routeObserver = new MutationObserver(() => {
            if (scroll.querySelector('.route-panel[data-phase="enter"] [data-page-header]') !== observedHeader) restore();
        });
        routeObserver.observe(scroll, { childList: true, subtree: true });
        scroll.addEventListener("scroll", remember, { passive: true });
        scroll.addEventListener("click", remember, true);
        scroll.addEventListener("wheel", cancel, { passive: true });
        scroll.addEventListener("touchstart", cancel, { passive: true });
        scroll.addEventListener("keydown", cancel);
        return () => {
            observer?.disconnect();
            routeObserver.disconnect();
            scroll.removeEventListener("scroll", remember);
            scroll.removeEventListener("click", remember, true);
            scroll.removeEventListener("wheel", cancel);
            scroll.removeEventListener("touchstart", cancel);
            scroll.removeEventListener("keydown", cancel);
        };
    }, [key, scroll]);

    return null;
}
