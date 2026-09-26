"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import { authService } from "@/services/auth.service";
import { validateEmail, validatePassword, validationMessage } from "@/validation";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);
    const [requested, setRequested] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const resetToken = new URLSearchParams(window.location.search).get("token")?.trim();
        if (!resetToken) return;
        setToken(resetToken);
        setRequested(true);
    }, []);

    const requestReset = async (event: React.FormEvent) => {
        event.preventDefault();
        const validation = validationMessage(validateEmail(email));
        if (validation) return setError(validation);
        setLoading(true);
        setError("");
        try {
            await authService.requestPasswordReset(email.trim().toLowerCase(), turnstileToken || undefined);
            setRequested(true);
            setMessage("اگر حسابی با این ایمیل وجود داشته باشد، راهنمای بازیابی ارسال می‌شود.");
        } catch (caught: unknown) {
            setTurnstileResetKey((value) => value + 1);
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "ارسال درخواست ناموفق بود.");
        } finally {
            setLoading(false);
        }
    };

    const confirmReset = async (event: React.FormEvent) => {
        event.preventDefault();
        const validation = validationMessage(validatePassword(newPassword));
        if (validation) return setError(validation);
        if (!token.trim()) return setError("توکن بازیابی را وارد کن.");
        setLoading(true);
        setError("");
        try {
            await authService.confirmPasswordReset(token.trim(), newPassword);
            router.replace("/login");
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "توکن بازیابی نامعتبر یا منقضی شده است.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell backHref="/login" title="بازیابی رمز عبور">
            {message && <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">{message}</p>}
            {error && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</p>}
            {!requested ? (
                <form onSubmit={requestReset} className="space-y-4">
                    <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-700">ایمیل حساب</span>
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" autoComplete="email" className="w-full rounded-2xl border border-slate-200 px-10 py-3.5 text-sm outline-none focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10" />
                        </div>
                    </label>
                    <TurnstileWidget action="password_reset" onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
                    <SubmitButton loading={loading} label="ارسال راهنمای بازیابی" />
                </form>
            ) : (
                <form onSubmit={confirmReset} className="space-y-4">
                    <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-700">توکن بازیابی</span>
                        <input value={token} onChange={(event) => setToken(event.target.value)} dir="ltr" autoComplete="one-time-code" className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[#155aa6]" />
                    </label>
                    <label className="block space-y-2">
                        <span className="text-sm font-bold text-slate-700">رمز عبور جدید</span>
                        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} dir="ltr" autoComplete="new-password" maxLength={128} className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-[#155aa6]" />
                    </label>
                    <SubmitButton loading={loading} label="ثبت رمز عبور جدید" />
                </form>
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
