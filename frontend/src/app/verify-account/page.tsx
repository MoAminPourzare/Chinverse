"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, MailCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { authService } from "@/services/auth.service";

export default function VerifyAccountPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [email, setEmail] = useState("");
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const confirmation = useRef<Promise<number> | null>(null);
    const resendInProgress = useRef(false);

    useEffect(() => {
        let stopped = false;
        let statusInProgress = false;
        let sessionReady = false;
        const currentUrl = new URL(window.location.href);
        const emailLinkToken = currentUrl.searchParams.get("email_token")?.trim();
        if (emailLinkToken) {
            currentUrl.searchParams.delete("email_token");
            window.history.replaceState(window.history.state, "", currentUrl);
            confirmation.current ??= authService.confirmEmailVerification(emailLinkToken);
        }

        const checkStatus = async () => {
            if (stopped || !sessionReady || statusInProgress || document.hidden) return;
            statusInProgress = true;
            try {
                const status = await authService.getVerificationStatus();
                if (stopped) return;
                if (status.account_verified) {
                    router.replace("/");
                    return;
                }
                setEmail(status.email);
                setChecking(false);
            } catch (caught: unknown) {
                const status = (caught as { response?: { status?: number } }).response?.status;
                if (!stopped && (status === 401 || status === 403)) {
                    router.replace("/login?next=/verify-account");
                }
            } finally {
                statusInProgress = false;
            }
        };

        void (async () => {
            if (confirmation.current) {
                let verifiedAccountId: number;
                try {
                    verifiedAccountId = await confirmation.current;
                } catch {
                    if (!stopped) {
                        setError("این لینک منقضی شده یا قبلاً استفاده شده است. برای دریافت لینک تازه وارد حساب شو.");
                        setChecking(false);
                    }
                    return;
                }

                // Continue only the session belonging to the account this link verified.
                const matchingSession = await authService.restoreSession()
                    && await authService.getVerificationStatus()
                        .then((status) => status.account_verified && status.account_id === verifiedAccountId)
                        .catch(() => false);
                if (!stopped) router.replace(matchingSession ? "/" : "/login?email_verified=1");
                return;
            }

            const hasSession = await authService.restoreSession();
            if (stopped) return;
            if (!hasSession) {
                router.replace("/login?next=/verify-account");
                return;
            }
            sessionReady = true;
            await checkStatus();
        })().catch(() => {
            if (!stopped) router.replace("/login?next=/verify-account");
        });

        const interval = window.setInterval(() => void checkStatus(), 5000);
        const onReturn = () => void checkStatus();
        window.addEventListener("focus", onReturn);
        document.addEventListener("visibilitychange", onReturn);
        return () => {
            stopped = true;
            window.clearInterval(interval);
            window.removeEventListener("focus", onReturn);
            document.removeEventListener("visibilitychange", onReturn);
        };
    }, [router]);

    const resendEmail = async () => {
        if (resendInProgress.current) return;
        resendInProgress.current = true;
        setResending(true);
        setError("");
        setMessage("");
        try {
            await authService.requestEmailVerification();
            setMessage("درخواست ارسال دوباره ثبت شد. صندوق ایمیل و پوشهٔ اسپم را بررسی کن.");
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "انجام درخواست ناموفق بود. دوباره تلاش کن.");
        } finally {
            resendInProgress.current = false;
            setResending(false);
        }
    };

    return (
        <AuthShell backHref="/login" title="تأیید حساب" icon={<MailCheck size={22} />}>
            {error && <p role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
            {checking && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-600">
                    <Loader2 size={18} className="animate-spin" />
                    در حال بررسی وضعیت ایمیل…
                </div>
            )}

            {!checking && email && (
                <div className="space-y-4">
                    <h1 className="text-xl font-black text-slate-950">صندوق ایمیلت را چک کن</h1>
                    <p className="text-sm leading-7 text-slate-700">
                        لینک تأیید حساب را به <bdi dir="ltr" className="break-all font-bold text-[#155aa6]">{email}</bdi> فرستادیم.
                        ایمیل را باز کن و روی «تأیید حساب» بزن تا حسابت فعال شود.
                    </p>
                    <p className="text-sm leading-7 text-slate-600">
                        می‌توانی این صفحه را باز بگذاری. بعد از تأیید، خودکار وارد چین‌ورس می‌شوی. اگر ایمیل را پیدا نکردی، پوشهٔ هرزنامه را هم چک کن.
                    </p>
                    {message && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
                    <button
                        type="button"
                        onClick={() => void resendEmail()}
                        disabled={resending}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#155aa6] px-4 text-sm font-bold text-[#155aa6] disabled:opacity-50"
                    >
                        {resending ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
                        ارسال دوبارهٔ لینک تأیید
                    </button>
                </div>
            )}
            {!checking && !email && error && (
                <Link className="text-sm font-bold text-[#155aa6]" href="/login?next=/verify-account">رفتن به صفحهٔ ورود</Link>
            )}
        </AuthShell>
    );
}
