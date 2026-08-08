"use client";

import { useEffect, useRef } from "react";

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string;
            remove: (widgetId: string) => void;
        };
    }
}

const SCRIPT_ID = "chinverse-turnstile-script";

export default function TurnstileWidget({
    action,
    onTokenChange,
    resetKey = 0,
}: {
    action: "login" | "signup" | "password_reset";
    onTokenChange: (token: string | null) => void;
    resetKey?: number;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    useEffect(() => {
        if (!siteKey || !containerRef.current) return;
        let widgetId: string | null = null;
        let cancelled = false;
        onTokenChange(null);

        const render = () => {
            if (cancelled || widgetId || !window.turnstile || !containerRef.current) return;
            widgetId = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                action,
                theme: "light",
                language: "fa",
                callback: (token: string) => onTokenChange(token),
                "expired-callback": () => onTokenChange(null),
                "error-callback": () => onTokenChange(null),
            });
        };

        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
            if (window.turnstile) render();
            else existing.addEventListener("load", render, { once: true });
        } else {
            const script = document.createElement("script");
            script.id = SCRIPT_ID;
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            script.addEventListener("load", render, { once: true });
            document.head.appendChild(script);
        }

        return () => {
            cancelled = true;
            if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
        };
    }, [action, onTokenChange, resetKey, siteKey]);

    if (!siteKey) return null;
    return <div ref={containerRef} className="flex min-h-[65px] justify-center" />;
}
