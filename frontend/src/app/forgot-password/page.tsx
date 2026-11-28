"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import { authService } from "@/services/auth.service";
import { validateEmail, validatePassword, validationMessage } from "@/validation";

const codePattern = /^[A-Za-z0-9_-]{43}$/;
const inputClass = "min-h-12 w-full rounded-2xl border border-slate-300 bg-white py-3 text-sm text-slate-900 focus-visible:border-[#155aa6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155aa6]";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);
    const [requested, setRequested] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const url = new URL(window.location.href);
        const legacyCode = url.searchParams.get("token")?.trim();
        if (legacyCode === undefined) return;
        url.searchParams.delete("token");
        window.history.replaceState(window.history.state, "", url);
        if (codePattern.test(legacyCode)) {
            startTransition(() => {
                setCode(legacyCode);
                setRequested(true);
            });
        }
    }, []);

    const requestReset = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loading) return;
        const validation = validationMessage(validateEmail(email));
        if (validation) return setError(validation);
        setLoading(true);
        setError("");
        try {
            await authService.requestPasswordReset(email.trim().toLowerCase(), turnstileToken || undefined);
            setRequested(true);
        } catch (caught: unknown) {
            setTurnstileResetKey((value) => value + 1);
            setTurnstileToken(null);
            const status = (caught as { response?: { status?: number } })?.response?.status;
            setError(status === 429 ? "برای گرفتن کد تازه، کمی صبر کن." : "درخواست کد بازیابی ثبت نشد. دوباره تلاش کن.");
        } finally {
            setLoading(false);
        }
    };

    const confirmReset = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loading) return;
        const recoveryCode = code.trim();
        if (!codePattern.test(recoveryCode)) return setError("کد بازیابی را کامل از ایمیل کپی کن.");
        const validation = validationMessage(validatePassword(newPassword));
        if (validation) return setError(validation);
        setLoading(true);
        setError("");
        try {
            await authService.confirmPasswordReset(recoveryCode, newPassword);
            router.replace("/login?password_reset=1");
        } catch (caught: unknown) {
            const response = (caught as { response?: { status?: number; data?: { detail?: string } } })?.response;
            if (response?.status === 401) {
                setError("کد بازیابی نادرست یا منقضی شده است. از آخرین ایمیل کد را بردار یا کد تازه بگیر.");
            } else if (response?.status === 429) {
                setError("تعداد تلاش‌ها زیاد شد. کمی صبر کن و دوباره امتحان کن.");
            } else if (response?.status === 400 && response.data?.detail === "رمز عبور نباید شامل نام کاربری ایمیل باشد") {
                setError(response.data.detail);
            } else {
                setError("ثبت رمز جدید انجام نشد. دوباره تلاش کن.");
            }
            setLoading(false);
        }
    };

    const startOver = () => {
        setRequested(false);
        setCode("");
        setNewPassword("");
        setError("");
        setTurnstileToken(null);
    };

    return (
        <AuthShell backHref="/login" title="بازیابی رمز عبور" icon={<KeyRound size={22} />}>
            {error && <p role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>}
            {!requested ? (
                <form onSubmit={requestReset} className="flex flex-col gap-5" noValidate>
                    <div className="flex flex-col gap-3">
                        <label htmlFor="reset-email" className="text-sm font-bold text-slate-700">ایمیل حساب</label>
                        <div className="relative">
                            <Mail aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input id="reset-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" autoComplete="email" className={`${inputClass} pl-4 pr-9`} required />
                        </div>
                    </div>
                    <TurnstileWidget action="password_reset" onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
                    <SubmitButton loading={loading} label="ارسال کد بازیابی" />
                </form>
            ) : (
                <div className="space-y-5">
                    {email && (
                        <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">
                            اگر حسابی با نشانی <bdi dir="ltr" className="break-all font-bold">{email.trim()}</bdi> وجود داشته باشد، کد بازیابی به آن ارسال می‌شود. کد آخرین ایمیل را وارد کن.
                        </p>
                    )}
                    <form onSubmit={confirmReset} className="flex flex-col gap-5" noValidate>
                        <div className="flex flex-col gap-3">
                            <label htmlFor="reset-code" className="text-sm font-bold text-slate-700">کد بازیابی</label>
                            <input id="reset-code" name="code" value={code} onChange={(event) => setCode(event.target.value)} dir="ltr" autoComplete="one-time-code" autoCapitalize="off" spellCheck={false} className={`${inputClass} px-4 font-mono`} required />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label htmlFor="reset-new-password" className="text-sm font-bold text-slate-700">رمز عبور جدید</label>
                            <input id="reset-new-password" name="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} dir="ltr" autoComplete="new-password" maxLength={128} className={`${inputClass} px-4`} required />
                        </div>
                        <SubmitButton loading={loading} label="ثبت رمز عبور جدید" />
                    </form>
                    <button type="button" onClick={startOver} disabled={loading} className="min-h-11 text-sm font-bold text-[#155aa6] disabled:opacity-50">
                        دریافت کد تازه یا تغییر ایمیل
                    </button>
                </div>
            )}
        </AuthShell>
    );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
    return (
        <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#155aa6] text-sm font-black text-white disabled:opacity-50">
            {loading && <Loader2 size={17} className="animate-spin" />}
            {label}
        </button>
    );
}
