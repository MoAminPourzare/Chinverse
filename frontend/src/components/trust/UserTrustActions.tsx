"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Ban, Loader2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import { trustService } from "@/services/trust.service";

export default function UserTrustActions({
    userId,
    tone = "default",
    onBlocked,
}: {
    userId: number;
    tone?: "default" | "light";
    onBlocked?: () => void;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const actionsId = useId();
    const [menuOpen, setMenuOpen] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [pending, setPending] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        let active = true;
        trustService.listBlocks()
            .then((items) => {
                if (active) setBlocked(items.some((item) => item.blocked_user_id === userId));
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, [userId]);

    useEffect(() => {
        const close = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, []);

    const toggleBlock = async () => {
        if (!blocked && !window.confirm("این کاربر مسدود شود؟ ارتباط و دنبال‌کردن دوطرفه متوقف می‌شود.")) return;
        setPending("block");
        setMessage("");
        try {
            if (blocked) {
                await trustService.unblockUser(userId);
                setBlocked(false);
                setMessage("مسدودسازی برداشته شد.");
            } else {
                await trustService.blockUser(userId);
                setBlocked(true);
                setMessage("کاربر مسدود شد.");
                onBlocked?.();
            }
            setMenuOpen(false);
        } catch {
            setMessage("انجام این درخواست ممکن نشد.");
        } finally {
            setPending("");
        }
    };

    return (
        <div ref={rootRef} className="relative z-30">
            <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="گزینه‌های ایمنی"
                aria-expanded={menuOpen}
                aria-controls={menuOpen ? actionsId : undefined}
                title="گزینه‌های ایمنی"
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition",
                    tone === "light" ? "bg-white/12 text-white hover:bg-white/20" : "text-slate-600 hover:bg-slate-100",
                )}
            >
                <MoreVertical size={20} />
            </button>

            {menuOpen && (
                <div id={actionsId} className="absolute left-0 top-12 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-right shadow-xl" dir="rtl">
                    <button type="button" onClick={() => void toggleBlock()} disabled={pending === "block"} className="flex h-11 w-full items-center gap-3 px-4 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                        {pending === "block" ? <Loader2 size={17} className="animate-spin" /> : <Ban size={17} />}
                        {blocked ? "رفع مسدودی" : "مسدود کردن"}
                    </button>
                </div>
            )}

            {message && <div role="status" aria-live="polite" className="absolute left-0 top-12 w-56 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold leading-5 text-white shadow-xl">{message}</div>}
        </div>
    );
}
