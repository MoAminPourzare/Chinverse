"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, MailCheck } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { authService } from "@/services/auth.service";

function responseStatus(error: unknown) {
    return (error as { response?: { status?: number } })?.response?.status;
}

export default function VerifyAccountPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [checking, setChecking] = useState(true);
    const [statusAttempt, setStatusAttempt] = useState(0);
    const [afterSignup] = useState(() => typeof window !== "undefined"
        && new URLSearchParams(window.location.search).get("signup") === "1");
    const [code, setCode] = useState("");
    const [pending, setPending] = useState<"confirm" | "resend" | null>(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let stopped = false;
        void (async () => {
            const hasSession = await authService.restoreSession();
            if (stopped) return;
            if (!hasSession) {
                router.replace("/login");
                return;
            }
            const status = await authService.getVerificationStatus();
            if (stopped) return;
            if (status.account_verified) {
                router.replace("/");
                return;
            }
            setEmail(status.email);
            setChecking(false);
        })().catch((caught: unknown) => {
            if (stopped) return;
            const status = responseStatus(caught);
            if (status === 401 || status === 403) {
                router.replace("/login");
                return;
            }
            setError("وضعیت تأیید ایمیل دریافت نشد. دوباره تلاش کن.");
            setChecking(false);
        });
        return () => { stopped = true; };
    }, [router, statusAttempt]);

    const confirmCode = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (pending) return;
        const token = code.trim();
        setMessage("");
        if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
            setError("کد تأیید را کامل از ایمیل کپی کن.");
            return;
        }
        setPending("confirm");
        setError("");
        try {
            await authService.confirmEmailVerification(token);
            router.replace("/");
        } catch (caught) {
            const status = responseStatus(caught);
            if (status === 401 || status === 422) {
                setError("کد نادرست یا منقضی شده است. کد آخرین ایمیل را وارد کن یا کد تازه بگیر.");
            } else if (status === 429) {
                setError("تعداد تلاش‌ها زیاد شد. کمی صبر کن و دوباره امتحان کن.");
            } else {
                setError("تأیید ایمیل انجام نشد. دوباره تلاش کن.");
            }
            setPending(null);
        }
    };

    const resendCode = async () => {
        if (pending) return;
        setPending("resend");
        setError("");
        setMessage("");
        try {
            await authService.requestEmailVerification();
            setCode("");
            setMessage("درخواست کد تازه ثبت شد. کد آخرین ایمیل را وارد کن.");
        } catch (caught) {
            setError(responseStatus(caught) === 429
                ? "برای درخواست کد تازه، کمی صبر کن."
                : "درخواست کد تازه انجام نشد. دوباره تلاش کن.");
        } finally {
            setPending(null);
        }
    };

    const retryStatus = () => {
        setChecking(true);
        setError("");
        setStatusAttempt((attempt) => attempt + 1);
    };

    return (
        <AuthShell backHref="/login" title="تأیید ایمیل" icon={<MailCheck size={22} />}>
            {error && <p role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
            {checking && (
                <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-600">
                    <Loader2 size={18} className="animate-spin" />
                    در حال بررسی وضعیت ایمیل…
                </div>
            )}
            {!checking && email && (
                <div className="space-y-4">
                    <h2 className="text-xl font-black text-slate-950">{afterSignup ? "صندوق ایمیلت را چک کن" : "ثبت‌نامت را کامل کن"}</h2>
                    <p className="text-sm leading-7 text-slate-700">
                        {afterSignup ? "کد تأیید را به " : "برای تکمیل ثبت‌نام، کدی را که به "}
                        <bdi dir="ltr" className="break-all font-bold text-[#155aa6]">{email}</bdi>
                        {afterSignup ? " فرستادیم. کد را از ایمیل کپی کن و اینجا وارد کن." : " فرستاده شده وارد کن."}
                    </p>
                    <form onSubmit={(event) => void confirmCode(event)} className="space-y-2">
                        <label htmlFor="email-verification-code" className="block text-sm font-bold text-slate-700">کد تأیید داخل ایمیل</label>
                        <input
                            id="email-verification-code"
                            dir="ltr"
                            type="text"
                            autoComplete="one-time-code"
                            spellCheck={false}
                            autoCapitalize="off"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            className="min-h-12 w-full rounded-xl border border-slate-300 px-3 font-mono text-slate-950"
                            required
                        />
                        <button type="submit" disabled={pending !== null} className="min-h-12 w-full rounded-xl bg-[#155aa6] px-3 text-sm font-bold text-white disabled:opacity-50">
                            {pending === "confirm" ? "در حال تأیید…" : "تأیید و ورود"}
                        </button>
                    </form>
                    {message && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
                    <button
                        type="button"
                        onClick={() => void resendCode()}
                        disabled={pending !== null}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#155aa6] px-4 text-sm font-bold text-[#155aa6] disabled:opacity-50"
                    >
                        {pending === "resend" ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
                        ارسال دوبارهٔ کد
                    </button>
                </div>
            )}
            {!checking && !email && error && (
                <button type="button" onClick={retryStatus} className="min-h-11 text-sm font-bold text-[#155aa6]">تلاش دوباره</button>
            )}
        </AuthShell>
    );
}
