"use client";

import { useState } from "react";
import { Flag, Loader2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { type ReportReason, type ReportTargetType, trustService } from "@/services/trust.service";

const reasons: Array<{ value: ReportReason; label: string }> = [
    { value: "spam", label: "هرزنامه" },
    { value: "harassment", label: "آزار یا تهدید" },
    { value: "hate", label: "نفرت‌پراکنی" },
    { value: "impersonation", label: "جعل هویت" },
    { value: "fraud", label: "کلاهبرداری" },
    { value: "privacy", label: "نقض حریم خصوصی" },
    { value: "illegal", label: "محتوای غیرقانونی" },
    { value: "other", label: "سایر" },
];

export default function ReportContentButton({
    targetType,
    targetId,
    className,
}: {
    targetType: ReportTargetType;
    targetId: number;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<ReportReason>("spam");
    const [details, setDetails] = useState("");
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState("");

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        try {
            await trustService.report(targetType, targetId, reason, details);
            setOpen(false);
            setDetails("");
            setMessage("گزارش ثبت شد.");
        } catch (caught: unknown) {
            const error = caught as { response?: { status?: number } };
            if (error.response?.status === 401) setMessage("برای ثبت گزارش وارد حسابت شو.");
            else if (error.response?.status === 409) setMessage("این گزارش قبلاً ثبت شده است.");
            else if (error.response?.status === 400) setMessage("محتوای خودت را نمی‌توانی گزارش کنی.");
            else setMessage("ثبت گزارش ممکن نشد.");
        } finally {
            setPending(false);
        }
    };

    return (
        <>
            <div className="relative">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        setOpen(true);
                        setMessage("");
                    }}
                    title="گزارش محتوا"
                    aria-label="گزارش محتوا"
                    className={cn("flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-amber-300 hover:text-amber-700", className)}
                >
                    <Flag size={16} />
                </button>
                {message && !open && (
                    <span className="absolute left-0 top-11 z-30 w-52 rounded-lg bg-slate-950 px-3 py-2 text-right text-[11px] font-bold leading-5 text-white shadow-xl" dir="rtl">
                        {message}
                    </span>
                )}
            </div>

            {open && (
                <div className="fixed inset-0 z-[180] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center" dir="rtl">
                    <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={20} className="text-[#155aa6]" />
                                <h2 className="text-base font-black text-slate-900">گزارش محتوا</h2>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} aria-label="بستن" title="بستن" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
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
                        {message && <p className="mt-3 text-xs font-bold text-rose-600">{message}</p>}
                        <button type="submit" disabled={pending} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#155aa6] text-sm font-black text-white disabled:opacity-50">
                            {pending && <Loader2 size={17} className="animate-spin" />}
                            ثبت گزارش
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
