"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Mail, Lock } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { authService } from "@/services/auth.service";
import { cn } from "@/lib/cn";
import { validateEmail, validateTextLength, validationMessage } from "@/validation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const nextErrors = {
            email: validationMessage(validateEmail(email)),
            password: validationMessage(validateTextLength(password, "رمز عبور", { required: true, max: 72 })),
        };
        setFieldErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        setLoading(true);

        try {
            await authService.login({ username: email.trim().toLowerCase(), password });
            router.push("/");
        } catch (err: unknown) {
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
            icon={<Image src="/assets/chinverse/icons/Exit.svg" alt="" width={30} height={30} className="h-8 w-8 object-contain" />}
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

                <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">رمز عبور</span>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setFieldErrors((current) => ({ ...current, password: "" }));
                            }}
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

                <PrimaryButton type="submit" className="mt-2 w-full py-3.5" leadingIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                    {loading ? "در حال ورود..." : "ورود"}
                </PrimaryButton>
            </form>
        </AuthShell>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-xs font-bold leading-5 text-rose-600">{message}</p>;
}
