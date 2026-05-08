"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Mail, Lock, Phone, User } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/cn";

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        phone: "",
        display_name: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await authService.signup(formData);
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
            title="حساب تازه بساز"
            subtitle="با یک حساب ساده شروع کن تا مسیرهای یادگیری، ویدیوها و تمرین‌های شخصی‌سازی‌شده را داشته باشی."
            footer={
                <p className="text-center text-sm text-slate-600">
                    حساب داری؟{" "}
                    <Link href="/login" className="font-semibold text-rose-600 transition-colors hover:text-rose-700">
                        وارد شو
                    </Link>
                </p>
            }
        >
            <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
                    Create account
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    ثبت نام
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                    فقط چند فیلد ساده. بعد از ثبت نام می‌توانی پروفایل و مسیر آموزشی‌ات را کامل کنی.
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
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
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
                            )}
                        />
                    </div>
                </label>

                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">ایمیل</span>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            dir="ltr"
                            placeholder="example@mail.com"
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
                            )}
                        />
                    </div>
                </label>

                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">شماره موبایل</span>
                    <div className="relative">
                        <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            dir="ltr"
                            placeholder="09120000000"
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
                            )}
                        />
                    </div>
                </label>

                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">رمز عبور</span>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            dir="ltr"
                            placeholder="••••••••"
                            className={cn(
                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                "focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
                            )}
                        />
                    </div>
                </label>

                <PrimaryButton type="submit" className="mt-2 w-full" leadingIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                    {loading ? "در حال ثبت..." : "ثبت نام"}
                </PrimaryButton>
            </form>
        </AuthShell>
    );
}
