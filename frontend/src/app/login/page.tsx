"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import TurnstileWidget from "@/components/auth/TurnstileWidget";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/cn";
import { validateEmail, validateTextLength, validationMessage } from "@/validation";

export default function LoginPage() {
    const router = useRouter();
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const [nextPath] = useState(() => {
        if (typeof window === "undefined") return "/";
        const value = new URLSearchParams(window.location.search).get("next");
        return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
    });
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mfaCode, setMfaCode] = useState("");
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [notice] = useState(() => {
        if (typeof window === "undefined") return "";
        return new URLSearchParams(window.location.search).get("email_verified") === "1"
            ? "ایمیل با موفقیت تأیید شد. حالا وارد حسابت شو."
            : "";
    });

    const togglePasswordVisibility = () => {
        const livePassword = passwordInputRef.current?.value;
        if (livePassword !== undefined && livePassword !== password) {
            setPassword(livePassword);
        }
        setShowPassword((visible) => !visible);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const nextErrors = {
            email: validationMessage(validateEmail(email)),
            password: validationMessage(validateTextLength(password, "رمز عبور", { required: true, max: 128 })),
        };
        setFieldErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        setLoading(true);

        try {
            const session = await authService.login({
                username: email.trim().toLowerCase(),
                password,
                mfa_code: mfaCode.trim() || undefined,
                turnstile_token: turnstileToken || undefined,
            });
            router.replace(session.requires_verification ? "/verify-account" : nextPath);
            router.refresh();
        } catch (err: unknown) {
            setTurnstileResetKey((value) => value + 1);
            const apiError = err as { response?: { data?: { detail?: string } } };
            const errorMessage = apiError.response?.data?.detail || "ورود ناموفق بود. لطفا دوباره تلاش کن.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            backHref="/settings"
            title="ورود"
            icon={<Image src="/assets/chinverse/icons/Exit.svg" alt="" width={30} height={30} className="h-8 w-8 object-contain" priority />}
            iconClassName="bg-transparent shadow-none ring-0"
            footer={
                <p className="text-center text-sm leading-6 text-slate-600">
                    هنوز حساب نداری؟{" "}
                    <Link href="/signup" className="font-bold text-[#155aa6] transition-colors hover:text-[#0f4e92]">
                        ثبت نام کن
                    </Link>
                </p>
            }
        >
            <div className="mb-6">
                <h2 className="text-xl font-black text-slate-950">خوش برگشتی</h2>
            </div>

            {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm leading-6">{error}</p>
                </div>
            )}
            {notice && (
                <p className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                    {notice}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">ایمیل</span>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setFieldErrors((current) => ({ ...current, email: "" }));
                            }}
                            dir="ltr"
                            placeholder="example@mail.com"
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12",
                            )}
                        />
                    </div>
                    <FieldError message={fieldErrors.email} />
                </label>

                <label htmlFor="login-password" className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">رمز عبور</span>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={passwordInputRef}
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setFieldErrors((current) => ({ ...current, password: "" }));
                            }}
                            dir="ltr"
                            autoComplete="current-password"
                            maxLength={128}
                            placeholder="••••••••"
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12",
                            )}
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none"
                            aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <FieldError message={fieldErrors.password} />
                    <Link href="/forgot-password" className="inline-block text-xs font-bold text-[#155aa6] hover:text-[#0f4e92]">
                        رمز عبورت را فراموش کرده‌ای؟
                    </Link>
                </label>

                <label htmlFor="login-mfa-code" className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">کد احراز هویت دومرحله‌ای <span className="font-normal text-slate-400">(در صورت فعال بودن)</span></span>
                    <div className="relative">
                        <KeyRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            id="login-mfa-code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={mfaCode}
                            onChange={(event) => setMfaCode(event.target.value.replace(/\s/g, ""))}
                            dir="ltr"
                            placeholder="123456"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12"
                        />
                    </div>
                </label>

                <TurnstileWidget action="login" onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />

                <PrimaryButton type="submit" className="mt-2 w-full py-3.5" leadingIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                    {loading ? "در حال ورود…" : "ورود"}
                </PrimaryButton>
            </form>
        </AuthShell>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-xs font-bold leading-5 text-rose-600">{message}</p>;
}
