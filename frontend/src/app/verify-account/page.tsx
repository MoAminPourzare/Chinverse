"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, MailCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { authService } from "@/services/auth.service";

function responseStatus(error: unknown) {
    return (error as { response?: { status?: number } })?.response?.status;
}

function confirmationError(error: unknown) {
    const status = responseStatus(error);
    if (status === 400 || status === 401 || status === 422) {
        return "این لینک یا کد معتبر نیست. اگر ایمیل تازه‌تری داری، از همان استفاده کن یا لینک تازه بگیر.";
    }
    if (status === 429) return "تعداد تلاش‌ها زیاد شد. کمی صبر کن و دوباره امتحان کن.";
    return "تأیید ایمیل فعلاً انجام نشد. دوباره تلاش کن.";
}

export default function VerifyAccountPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [email, setEmail] = useState("");
    const [afterSignup] = useState(() => typeof window !== "undefined"
        && new URLSearchParams(window.location.search).get("signup") === "1");
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [linkAttempt, setLinkAttempt] = useState(0);
    const [canRetryLink, setCanRetryLink] = useState(false);
    const [code, setCode] = useState("");
    const [confirmingCode, setConfirmingCode] = useState(false);
    const linkToken = useRef<string | null>(null);
    const confirmation = useRef<Promise<number> | null>(null);
    const resendInProgress = useRef(false);

    useEffect(() => {
        let stopped = false;
        let statusInProgress = false;
        let sessionReady = false;
        const currentUrl = new URL(window.location.href);
        const emailLinkToken = currentUrl.searchParams.get("email_token")?.trim();
        if (emailLinkToken) {
            linkToken.current = emailLinkToken;
            currentUrl.searchParams.delete("email_token");
            window.history.replaceState(window.history.state, "", currentUrl);
        }
        if (linkToken.current) confirmation.current ??= authService.confirmEmailVerification(linkToken.current);

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
                const status = responseStatus(caught);
                if (!stopped && (status === 401 || status === 403)) router.replace("/login");
            } finally {
                statusInProgress = false;
            }
        };

        void (async () => {
            if (confirmation.current) {
                let verifiedAccountId: number;
                try {
                    verifiedAccountId = await confirmation.current;
                } catch (caught) {
                    if (!stopped) {
                        const status = responseStatus(caught);
                        setError(confirmationError(caught));
                        setCanRetryLink(status === undefined || status === 429 || status >= 500);
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
                router.replace("/login");
                return;
            }
            sessionReady = true;
            await checkStatus();
        })().catch(() => {
            if (!stopped) router.replace("/login");
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
    }, [router, linkAttempt]);

    const retryLink = () => {
        confirmation.current = null;
        setError("");
        setCanRetryLink(false);
        setChecking(true);
        setLinkAttempt((attempt) => attempt + 1);
    };

    const resendEmail = async () => {
        if (resendInProgress.current) return;
        resendInProgress.current = true;
        setResending(true);
        setError("");
        setMessage("");
        try {
            await authService.requestEmailVerification();
            setMessage("لینک تازهٔ تأیید درخواست شد.");
        } catch (caught: unknown) {
            setError(responseStatus(caught) === 429
                ? "برای درخواست لینک تازه، کمی صبر کن."
                : "درخواست ارسال لینک انجام نشد. دوباره تلاش کن.");
        } finally {
            resendInProgress.current = false;
            setResending(false);
        }
    };

    const confirmCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const token = code.trim();
        if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
            setError("کد تأیید را کامل از ایمیل کپی کن.");
            return;
        }
        setConfirmingCode(true);
        setError("");
        setMessage("");
        try {
            const accountId = await authService.confirmEmailVerification(token);
            const status = await authService.getVerificationStatus();
            if (status.account_verified && status.account_id === accountId) router.replace("/");
            else setError("این کد برای نشانی ایمیل دیگری است.");
        } catch (caught) {
            setError(confirmationError(caught));
        } finally {
            setConfirmingCode(false);
        }
    };

    return (
        <AuthShell backHref="/login" title="تأیید ایمیل" icon={<MailCheck size={22} />}>
            {error && <p role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
            {checking && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-600">
                    <Loader2 size={18} className="animate-spin" />
                    در حال بررسی وضعیت ایمیل…
                </div>
            )}

            {!checking && email && (
                <div className="space-y-4">
                    <h2 className="text-xl font-black text-slate-950">{afterSignup ? "صندوق ایمیلت را چک کن" : "ثبت‌نامت را کامل کن"}</h2>
                    <p className="text-sm leading-7 text-slate-700">
                        {afterSignup ? "لینک تأیید حساب را به " : "برای تکمیل ثبت‌نام، نشانی "}
                        <bdi dir="ltr" className="break-all font-bold text-[#155aa6]">{email}</bdi>
                        {afterSignup ? " فرستادیم. ایمیل را باز کن و روی «تأیید حساب» بزن." : " را تأیید کن. ایمیل ثبت‌نام را باز کن یا لینک تازه بگیر."}
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
                    <details className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                        <summary className="cursor-pointer font-bold text-[#155aa6]">لینک باز نمی‌شود؟</summary>
                        <form onSubmit={(event) => void confirmCode(event)} className="mt-3 space-y-2">
                            <label htmlFor="email-verification-code" className="block text-slate-700">کد تأیید داخل ایمیل</label>
                            <input
                                id="email-verification-code"
                                dir="ltr"
                                type="text"
                                autoComplete="one-time-code"
                                spellCheck={false}
                                autoCapitalize="off"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-slate-950"
                                required
                            />
                            <button type="submit" disabled={confirmingCode} className="min-h-11 w-full rounded-xl bg-[#155aa6] px-3 font-bold text-white disabled:opacity-50">
                                {confirmingCode ? "در حال تأیید…" : "تأیید حساب"}
                            </button>
                        </form>
                    </details>
                </div>
            )}
            {!checking && !email && error && (
                <div className="flex flex-wrap gap-4 text-sm font-bold text-[#155aa6]">
                    {canRetryLink && <button type="button" onClick={retryLink}>تلاش دوباره</button>}
                    <Link href="/login">رفتن به صفحهٔ ورود</Link>
                </div>
            )}
        </AuthShell>
    );
}
