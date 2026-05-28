"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Gift, Loader2, Mail, Lock, Phone, User } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/cn";
import {
    normalizeIranMobile,
    validateEmail,
    validateIranMobile,
    validatePassword,
    validateReferralCode,
    validateTextLength,
    validationMessage,
} from "@/validation";

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        phone: "",
        display_name: "",
        referral_code: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const referralCode = params.get("ref") || params.get("invite") || params.get("code") || "";
        if (!referralCode) return;

        setFormData((current) => ({
            ...current,
            referral_code: referralCode.toUpperCase().replace(/[-\s]/g, ""),
        }));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.name === "referral_code"
            ? e.target.value.toUpperCase().replace(/[-\s]/g, "")
            : e.target.value;

        setFormData({ ...formData, [e.target.name]: value });
        setFieldErrors((current) => ({ ...current, [e.target.name]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const nextErrors = {
            display_name: validationMessage(validateTextLength(formData.display_name, "نام و نام خانوادگی", { required: true, min: 2, max: 120 })),
            email: validationMessage(validateEmail(formData.email)),
            phone: validationMessage(validateIranMobile(formData.phone)),
            password: validationMessage(validatePassword(formData.password)),
            referral_code: validationMessage(validateReferralCode(formData.referral_code)),
        };
        const hasErrors = Object.values(nextErrors).some(Boolean);
        setFieldErrors(nextErrors);
        if (hasErrors) return;

        setLoading(true);

        try {
            await authService.signup({
                ...formData,
                email: formData.email.trim().toLowerCase(),
                phone: normalizeIranMobile(formData.phone),
                display_name: formData.display_name.trim(),
                referral_code: formData.referral_code.trim() || undefined,
            });
            router.push("/login");
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { detail?: string } } };
            const errorMessage = apiError.response?.data?.detail || "ثبت نام ناموفق بود. لطفا دوباره تلاش کن.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            backHref="/settings"
            title="ثبت نام"
            icon={<Image src="/assets/chinverse/icons/2 people.svg" alt="" width={30} height={30} className="h-8 w-8 object-contain" />}
            iconClassName="bg-transparent shadow-none ring-0"
            footer={
                <p className="text-center text-sm leading-6 text-slate-600">
                    قبلا حساب ساخته‌ای؟{" "}
                    <Link href="/login" className="font-bold text-[#155aa6] transition-colors hover:text-[#0f4e92]">
                        وارد شو
                    </Link>
                </p>
            }
        >
            <div className="mb-6">
                <h2 className="text-xl font-black text-slate-950">شروع مسیر چین‌ورس</h2>
            </div>

            {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm leading-6">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">نام و نام خانوادگی</span>
                    <div className="relative">
                        <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            name="display_name"
                            value={formData.display_name}
                            onChange={handleChange}
                            placeholder="نام خودت را وارد کن"
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12",
                            )}
                        />
                    </div>
                    <FieldError message={fieldErrors.display_name} />
                </label>

                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">ایمیل</span>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
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

                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">شماره موبایل</span>
                    <div className="relative">
                        <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            dir="ltr"
                            placeholder="09120000000"
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12",
                            )}
                        />
                    </div>
                    <FieldError message={fieldErrors.phone} />
                </label>

                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">رمز عبور</span>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            dir="ltr"
                            placeholder="••••••••"
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12",
                            )}
                        />
                    </div>
                    <FieldError message={fieldErrors.password} />
                </label>

                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">کد دعوت دوستان</span>
                    <div className="relative">
                        <Gift className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            name="referral_code"
                            value={formData.referral_code}
                            onChange={handleChange}
                            dir="ltr"
                            placeholder="اختیاری، مثلا CH12AB"
                            maxLength={32}
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3.5 text-left font-latin text-sm font-black uppercase tracking-[0.10em] text-slate-900 outline-none transition-all placeholder:text-right placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400",
                                "focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/12",
                            )}
                        />
                    </div>
                    <FieldError message={fieldErrors.referral_code} />
                </label>

                <PrimaryButton type="submit" className="mt-2 w-full py-3.5" leadingIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                    {loading ? "در حال ثبت..." : "ثبت نام"}
                </PrimaryButton>
            </form>
        </AuthShell>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-xs font-bold leading-5 text-rose-600">{message}</p>;
}
