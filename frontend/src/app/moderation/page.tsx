"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Loader2, ShieldCheck, Trash2, UserCheck, X } from "lucide-react";
import { AppHeader } from "@/components/ui/IconButton";
import { authService } from "@/services/auth.service";
import { type ReportInfo, trustService } from "@/services/trust.service";

type QueueStatus = "open" | "reviewing" | "resolved" | "dismissed";
type ModerationAction = "dismiss" | "resolve" | "remove" | "suspend_user";

const statuses: Array<{ value: QueueStatus; label: string }> = [
    { value: "open", label: "باز" },
    { value: "reviewing", label: "بررسی" },
    { value: "resolved", label: "رسیدگی‌شده" },
    { value: "dismissed", label: "ردشده" },
];

const targetLabels: Record<string, string> = {
    user: "کاربر",
    post: "پست",
    comment: "نظر",
    question: "سوال",
    answer: "پاسخ",
    article: "مقاله",
    article_comment: "نظر مقاله",
    gallery: "گالری",
    service: "خدمت",
    message: "پیام خصوصی",
};

const reasonLabels: Record<string, string> = {
    spam: "هرزنامه",
    harassment: "آزار یا تهدید",
    hate: "نفرت‌پراکنی",
    impersonation: "جعل هویت",
    fraud: "کلاهبرداری",
    privacy: "نقض حریم خصوصی",
    illegal: "محتوای غیرقانونی",
    other: "سایر",
};

export default function ModerationPage() {
    const router = useRouter();
    const [queueStatus, setQueueStatus] = useState<QueueStatus>("open");
    const [reports, setReports] = useState<ReportInfo[]>([]);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [securityHref, setSecurityHref] = useState("/login?next=/moderation");

    const loadQueue = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            if (!await authService.restoreSession()) {
                router.replace("/login?next=/moderation");
                return;
            }
            const access = await trustService.moderationAccess();
            if (!access.can_moderate) {
                setError("این حساب دسترسی بررسی گزارش‌ها را ندارد.");
                return;
            }
            if (!access.mfa_ready) {
                setSecurityHref(access.is_admin ? "/account/security" : "/login?next=/moderation");
                setError("برای دسترسی مدیریتی، احراز هویت دومرحله‌ای را کامل کن.");
                return;
            }
            setReports(await trustService.moderationQueue(queueStatus));
        } catch {
            setError("صف گزارش‌ها بارگذاری نشد.");
        } finally {
            setLoading(false);
        }
    }, [queueStatus, router]);

    useEffect(() => {
        void loadQueue();
    }, [loadQueue]);

    const resolve = async (report: ReportInfo, action: ModerationAction) => {
        const destructive = action === "remove" || action === "suspend_user";
        if (destructive && !window.confirm("این اقدام روی محتوای گزارش‌شده یا حساب کاربر اعمال شود؟")) return;
        setPending(`${report.id}:${action}`);
        setError("");
        setMessage("");
        try {
            await trustService.resolveReport(report.id, action, notes[report.id]);
            setReports((items) => items.filter((item) => item.id !== report.id));
            setMessage("نتیجه بررسی ثبت شد.");
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "ثبت نتیجه بررسی ناموفق بود.");
        } finally {
            setPending("");
        }
    };

    const claim = async (report: ReportInfo) => {
        setPending(`${report.id}:claim`);
        setError("");
        setMessage("");
        try {
            await trustService.claimReport(report.id);
            setReports((items) => items.filter((item) => item.id !== report.id));
            setMessage("گزارش برای بررسی شما رزرو شد و به صف بررسی منتقل شد.");
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "رزرو گزارش انجام نشد.");
        } finally {
            setPending("");
        }
    };

    return (
        <main className="min-h-full bg-[#f7f8fb] px-4 pb-12 pt-4" dir="rtl">
            <AppHeader title="مدیریت گزارش‌ها" backHref="/settings" icon={<ShieldCheck size={22} />} />
            <div className="mx-auto mt-6 w-full max-w-3xl">
                <div className="grid grid-cols-4 gap-2 rounded-lg bg-slate-100 p-1">
                    {statuses.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setQueueStatus(item.value)}
                            className={`min-h-10 rounded-md px-2 text-xs font-black transition ${queueStatus === item.value ? "bg-white text-[#155aa6] shadow-sm" : "text-slate-500"}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
                {error && (
                    <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold leading-7 text-rose-700">
                        {error}
                        {error.includes("دومرحله‌ای") && <Link href={securityHref} className="mr-2 underline">امنیت حساب</Link>}
                    </div>
                )}

                {loading ? (
                    <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-[#155aa6]" /></div>
                ) : !error && reports.length === 0 ? (
                    <div className="flex h-48 items-center justify-center text-sm font-bold text-slate-400">گزارشی در این وضعیت نیست.</div>
                ) : (
                    <div className="mt-5 space-y-3">
                        {reports.map((report) => (
                            <article key={report.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{targetLabels[report.target_type] || report.target_type} #{report.target_id}</p>
                                        <p className="mt-1 text-xs font-bold text-amber-700">{reasonLabels[report.reason] || report.reason}</p>
                                    </div>
                                    <time className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString("fa-IR")}</time>
                                </div>
                                {report.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{report.details}</p>}

                                {queueStatus === "open" || queueStatus === "reviewing" ? (
                                    <>
                                        <textarea
                                            value={notes[report.id] || ""}
                                            onChange={(event) => setNotes((items) => ({ ...items, [report.id]: event.target.value }))}
                                            rows={2}
                                            maxLength={2000}
                                            placeholder="یادداشت بررسی"
                                            className="mt-4 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#155aa6]"
                                        />
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {queueStatus === "open" && (
                                                <ActionButton icon={<UserCheck size={16} />} label="شروع بررسی" busy={pending === `${report.id}:claim`} onClick={() => void claim(report)} />
                                            )}
                                            <ActionButton icon={<X size={16} />} label="رد گزارش" busy={pending === `${report.id}:dismiss`} onClick={() => void resolve(report, "dismiss")} />
                                            <ActionButton icon={<Check size={16} />} label="بستن گزارش" busy={pending === `${report.id}:resolve`} onClick={() => void resolve(report, "resolve")} />
                                            {report.target_type === "user" ? (
                                                <ActionButton danger icon={<Ban size={16} />} label="تعلیق حساب" busy={pending === `${report.id}:suspend_user`} onClick={() => void resolve(report, "suspend_user")} />
                                            ) : (
                                                <ActionButton danger icon={<Trash2 size={16} />} label="حذف محتوا" busy={pending === `${report.id}:remove`} onClick={() => void resolve(report, "remove")} />
                                            )}
                                        </div>
                                    </>
                                ) : report.resolution ? (
                                    <p className="mt-3 text-xs font-bold text-slate-500">نتیجه: {report.resolution}</p>
                                ) : null}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

function ActionButton({
    icon,
    label,
    busy,
    danger = false,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    busy: boolean;
    danger?: boolean;
    onClick: () => void;
}) {
    return (
        <button type="button" onClick={onClick} disabled={busy} className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black disabled:opacity-50 ${danger ? "border-rose-200 text-rose-600" : "border-slate-200 text-slate-700"}`}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : icon}
            {label}
        </button>
    );
}
