"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail, Phone } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { authService, VerificationStatus } from "@/services/auth.service";

const emptyStatus: VerificationStatus = {
    email_verified: false,
    phone_verified: false,
    account_verified: false,
};

export default function VerifyAccountPage() {
    const router = useRouter();
    const [status, setStatus] = useState(emptyStatus);
    const [emailToken, setEmailToken] = useState("");
    const [phoneToken, setPhoneToken] = useState("");
    const [pending, setPending] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const initialized = useRef(false);

    const loadStatus = useCallback(async () => {
        if (!await authService.restoreSession()) {
            router.replace("/login?next=/verify-account");
            return;
        }
        const nextStatus = await authService.getVerificationStatus();
        setStatus(nextStatus);
        if (nextStatus.account_verified) router.replace("/");
    }, [router]);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const emailLinkToken = new URLSearchParams(window.location.search).get("email_token")?.trim();
        if (emailLinkToken) {
            setPending("email-link");
            void authService.confirmEmailVerification(emailLinkToken)
                .then(() => router.replace("/login?email_verified=1"))
                .catch((caught: unknown) => {
                    const apiError = caught as { response?: { data?: { detail?: string } } };
                    setError(apiError.response?.data?.detail || "لینک تأیید ایمیل نامعتبر یا منقضی شده است.");
                    setPending("");
                });
            return;
        }
        void loadStatus().catch(() => router.replace("/login?next=/verify-account"));
    }, [loadStatus, router]);

    const run = async (name: string, action: () => Promise<void>, success: string) => {
        setPending(name);
        setError("");
        setMessage("");
        try {
            await action();
            setMessage(success);
            await loadStatus();
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "انجام درخواست ناموفق بود. دوباره تلاش کن.");
        } finally {
            setPending("");
        }
    };

    return (
        <AuthShell backHref="/login" title="تأیید حساب">
            <p className="mb-5 text-sm leading-7 text-slate-600">
                برای فعال‌شدن کامل حساب، ایمیل و شماره موبایل را تأیید کن.
            </p>
            {message && <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
            {error && <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
            {pending === "email-link" && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-600">
                    <Loader2 size={18} className="animate-spin" />
                    در حال تأیید ایمیل…
                </div>
            )}

            {pending !== "email-link" && <VerificationSection
                icon={<Mail size={19} />}
                title="ایمیل"
                verified={status.email_verified}
                value={emailToken}
                placeholder="کد یا توکن ارسال‌شده"
                pending={pending}
                name="email"
                onChange={setEmailToken}
                onRequest={() => run("email-request", authService.requestEmailVerification, "لینک تأیید ایمیل دوباره ارسال شد.")}
                onConfirm={() => run("email-confirm", () => authService.confirmEmailVerification(emailToken.trim()), "ایمیل تأیید شد.")}
            />}

            {pending !== "email-link" && <VerificationSection
                icon={<Phone size={19} />}
                title="شماره موبایل"
                verified={status.phone_verified}
                value={phoneToken}
                placeholder="کد ۶ رقمی"
                pending={pending}
                name="phone"
                inputMode="numeric"
                onChange={(value) => setPhoneToken(value.replace(/\D/g, "").slice(0, 6))}
                onRequest={() => run("phone-request", authService.requestPhoneVerification, "کد موبایل دوباره ارسال شد.")}
                onConfirm={() => run("phone-confirm", () => authService.confirmPhoneVerification(phoneToken), "شماره موبایل تأیید شد.")}
            />}
        </AuthShell>
    );
}

function VerificationSection({
    icon,
    title,
    verified,
    value,
    placeholder,
    pending,
    name,
    inputMode,
    onChange,
    onRequest,
    onConfirm,
}: {
    icon: React.ReactNode;
    title: string;
    verified: boolean;
    value: string;
    placeholder: string;
    pending: string;
    name: string;
    inputMode?: "numeric";
    onChange: (value: string) => void;
    onRequest: () => void;
    onConfirm: () => void;
}) {
    const busy = pending.startsWith(name);
    return (
        <section className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <span className="text-[#155aa6]">{icon}</span>
                <span>{title}</span>
                {verified && <CheckCircle2 className="mr-auto text-emerald-500" size={20} />}
            </div>
            {!verified && (
                <>
                    <input
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        inputMode={inputMode}
                        dir="ltr"
                        placeholder={placeholder}
                        className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10"
                    />
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <button type="button" onClick={onRequest} disabled={busy} className="h-11 rounded-2xl border border-[#155aa6] text-xs font-black text-[#155aa6] disabled:opacity-50">ارسال دوباره</button>
                        <button type="button" onClick={onConfirm} disabled={busy || !value.trim()} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#155aa6] text-xs font-black text-white disabled:opacity-50">
                            {busy && <Loader2 size={15} className="animate-spin" />}
                            تأیید
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
