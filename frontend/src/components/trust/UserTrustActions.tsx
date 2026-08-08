"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, Flag, Loader2, MoreVertical, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { type ReportReason, trustService } from "@/services/trust.service";

const reasons: Array<{ value: ReportReason; label: string }> = [
    { value: "harassment", label: "آزار یا تهدید" },
    { value: "spam", label: "هرزنامه" },
    { value: "impersonation", label: "جعل هویت" },
    { value: "fraud", label: "کلاهبرداری" },
    { value: "privacy", label: "نقض حریم خصوصی" },
    { value: "hate", label: "نفرت‌پراکنی" },
    { value: "illegal", label: "محتوای غیرقانونی" },
    { value: "other", label: "سایر" },
];

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
    const [menuOpen, setMenuOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [reason, setReason] = useState<ReportReason>("harassment");
    const [details, setDetails] = useState("");
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

    const submitReport = async (event: React.FormEvent) => {
        event.preventDefault();
        setPending("report");
        setMessage("");
        try {
            await trustService.report("user", userId, reason, details);
            setReportOpen(false);
            setDetails("");
            setMessage("گزارش برای بررسی ثبت شد.");
        } catch (caught: unknown) {
            const error = caught as { response?: { status?: number } };
            setMessage(error.response?.status === 409 ? "این گزارش قبلاً ثبت شده است." : "ثبت گزارش ممکن نشد.");
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
                title="گزینه‌های ایمنی"
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition",
                    tone === "light" ? "bg-white/12 text-white hover:bg-white/20" : "text-slate-600 hover:bg-slate-100",
                )}
            >
                <MoreVertical size={20} />
            </button>

            {menuOpen && (
                <div className="absolute left-0 top-12 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-right shadow-xl" dir="rtl">
                    <button type="button" onClick={() => { setReportOpen(true); setMenuOpen(false); }} className="flex h-11 w-full items-center gap-3 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                        <Flag size={17} className="text-amber-600" />
                        گزارش کاربر
                    </button>
                    <button type="button" onClick={() => void toggleBlock()} disabled={pending === "block"} className="flex h-11 w-full items-center gap-3 px-4 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                        {pending === "block" ? <Loader2 size={17} className="animate-spin" /> : <Ban size={17} />}
                        {blocked ? "رفع مسدودی" : "مسدود کردن"}
                    </button>
                </div>
            )}

            {message && <div className="absolute left-0 top-12 w-56 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold leading-5 text-white shadow-xl">{message}</div>}

            {reportOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center" dir="rtl">
                    <form onSubmit={submitReport} className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={20} className="text-[#155aa6]" />
                                <h2 className="text-base font-black text-slate-900">گزارش کاربر</h2>
                            </div>
                            <button type="button" onClick={() => setReportOpen(false)} aria-label="بستن" title="بستن" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
                                <X size={19} />
                            </button>
                        </div>
                        <label className="mt-5 block text-sm font-bold text-slate-700">
                            دلیل گزارش
                            <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#155aa6]">
                                {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                        </label>
                        <label className="mt-4 block text-sm font-bold text-slate-700">
                            توضیحات
                            <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-[#155aa6]" />
                        </label>
                        <button type="submit" disabled={pending === "report"} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#155aa6] text-sm font-black text-white disabled:opacity-50">
                            {pending === "report" && <Loader2 size={17} className="animate-spin" />}
                            ثبت گزارش
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
