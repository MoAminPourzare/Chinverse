"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { authService } from "@/services/auth.service";

export default function VerifyAccountPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [canResend, setCanResend] = useState(false);
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const currentUrl = new URL(window.location.href);
        const emailLinkToken = currentUrl.searchParams.get("email_token")?.trim();
        if (emailLinkToken) {
            currentUrl.searchParams.delete("email_token");
            window.history.replaceState(null, "", currentUrl);
            void authService.confirmEmailVerification(emailLinkToken)
                .then(() => router.replace("/login?email_verified=1"))
                .catch(() => {
                    setError("لینک تأیید ایمیل نامعتبر یا منقضی شده است. برای گرفتن لینک تازه وارد حساب شو.");
                    setChecking(false);
                });
            return;
        }
        void (async () => {
            if (!await authService.restoreSession()) {
                router.replace("/login?next=/verify-account");
                return;
            }
            const status = await authService.getVerificationStatus();
            if (status.account_verified) {
                router.replace("/");
                return;
            }
            setCanResend(true);
            setChecking(false);
        })().catch(() => router.replace("/login?next=/verify-account"));
    }, [router]);

    const resendEmail = async () => {
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
            setResending(false);
        }
    };

    return (
        <AuthShell backHref="/login" title="تأیید حساب">
            <p className="mb-5 text-sm leading-7 text-slate-600">
                برای فعال‌کردن حساب، لینک تأیید را در ایمیل چین‌ورس باز کن.
            </p>
            {message && <p role="status" className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
            {error && <p role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
            {checking && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-600">
                    <Loader2 size={18} className="animate-spin" />
                    در حال بررسی وضعیت ایمیل…
                </div>
            )}

            {canResend && (
                <button
                    type="button"
                    onClick={() => void resendEmail()}
                    disabled={resending}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#155aa6] px-4 text-sm font-bold text-[#155aa6] disabled:opacity-50"
                >
                    {resending ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
                    ارسال دوبارهٔ لینک تأیید
                </button>
            )}
        </AuthShell>
    );
}
