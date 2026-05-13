"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Check,
    ChevronLeft,
    Crown,
    CreditCard,
    Loader2,
    ShieldCheck,
    Sparkles,
    Star,
    Zap,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import {
    SubscriptionCheckout,
    SubscriptionOverview,
    SubscriptionPlan,
    subscriptionService,
} from "@/services/subscription.service";

export default function SubscriptionSettingsPage() {
    const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkoutResult, setCheckoutResult] = useState<SubscriptionCheckout | null>(null);

    const selectedPlan = useMemo(() => {
        if (!overview?.plans.length) return null;
        return overview.plans.find((plan) => plan.id === selectedPlanId) || overview.plans[0];
    }, [overview?.plans, selectedPlanId]);

    const loadOverview = async () => {
        try {
            setError(null);
            const data = await subscriptionService.getOverview();
            setOverview(data);
            setSelectedPlanId((current) => current || data.plans.find((plan) => plan.is_recommended)?.id || data.plans[0]?.id || null);
        } catch (loadError) {
            console.error("Failed to load subscription overview", loadError);
            setError("بخش اشتراک باز نشد. لطفا دوباره تلاش کن.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, []);

    const handleCheckout = async () => {
        if (!selectedPlan) return;
        setIsCheckingOut(true);
        setCheckoutResult(null);
        setError(null);

        try {
            const result = await subscriptionService.checkout(selectedPlan.id);
            setCheckoutResult(result);
            if (result.checkout_url) {
                window.location.href = result.checkout_url;
            }
        } catch (checkoutError: unknown) {
            const apiError = checkoutError as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || "ساخت سفارش پرداخت انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fb]" dir="rtl">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                    <span>در حال آماده سازی اشتراک...</span>
                </div>
            </div>
        );
    }

    if (!overview || (error && !selectedPlan)) {
        return (
            <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
                <EmptyState
                    icon={<AlertCircle size={30} />}
                    title="اشتراک باز نشد"
                    description={error || "داده ای برای نمایش پیدا نشد."}
                    action={<PrimaryButton onClick={loadOverview}>تلاش دوباره</PrimaryButton>}
                />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <header className="sticky top-3 z-40 mb-5 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <Link
                    href="/settings"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100"
                    aria-label="بازگشت"
                >
                    <ArrowRight size={22} />
                </Link>
                <div className="text-center">
                    <h1 className="text-base font-black text-slate-950">مدیریت اشتراک</h1>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">پلن یادگیری و پرداخت</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 text-amber-600">
                    <Crown size={22} />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <section className="overflow-hidden rounded-[34px] border border-slate-900 bg-slate-950 text-white shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
                    <div className="relative p-5">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.38),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(244,63,94,0.28),transparent_36%),linear-gradient(135deg,#111827_0%,#7f1d1d_55%,#f97316_135%)]" />
                        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
                        <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-amber-100">Chinverse VIP</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">یادگیری پیوسته، بدون محدودیت</h2>
                                    <p className="mt-3 text-sm leading-7 text-white/75">
                                        اشتراک را برای دسترسی کامل به مسیرهای آموزشی، تمرین ها و امکانات ویژه آماده کردیم. پرداخت واقعی بعدا به همین بخش وصل می شود.
                                    </p>
                                </div>
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-white/15 bg-white/[0.12] shadow-inner">
                                    <Crown size={30} />
                                </div>
                            </div>

                            {overview.current_subscription ? (
                                <div className="mt-5 rounded-[26px] border border-emerald-300/30 bg-emerald-400/15 p-4">
                                    <div className="flex items-center gap-2 text-emerald-100">
                                        <ShieldCheck size={18} />
                                        <p className="text-sm font-black">اشتراک فعال داری</p>
                                    </div>
                                    <p className="mt-2 text-xs leading-6 text-white/75">
                                        {overview.current_subscription.plan_name} تا {formatDate(overview.current_subscription.end_date)} فعال است.
                                        {overview.current_subscription.days_remaining > 0
                                            ? ` ${toPersianDigits(overview.current_subscription.days_remaining)} روز باقی مانده.`
                                            : ""}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 grid grid-cols-3 gap-2">
                                    <MiniStat icon={<Zap size={15} />} label="تمرین" value="روزانه" />
                                    <MiniStat icon={<Star size={15} />} label="محتوا" value="کامل" />
                                    <MiniStat icon={<ShieldCheck size={15} />} label="پرداخت" value="آماده" />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <Surface className="overflow-hidden border-white bg-white/95 p-0 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-500">Plans</p>
                        <h2 className="mt-1 text-base font-black text-slate-950">پلن مورد نظرت را انتخاب کن</h2>
                    </div>
                    <div className="space-y-3 p-4">
                        {overview.plans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                selected={selectedPlan?.id === plan.id}
                                active={overview.current_subscription?.plan_id === plan.id}
                                onSelect={() => setSelectedPlanId(plan.id)}
                            />
                        ))}
                    </div>
                </Surface>

                <Surface className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-amber-50 text-amber-600">
                            <Sparkles size={21} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-black text-slate-950">امکانات این بسته</h2>
                            <div className="mt-3 space-y-2">
                                {overview.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                                        <Check className="mt-1 h-4 w-4 shrink-0 text-rose-500" />
                                        <p className="text-xs leading-6 text-slate-600">{feature}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Surface>

                {error && (
                    <div className="rounded-[24px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
                        {error}
                    </div>
                )}

                {checkoutResult && (
                    <div className="rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
                        <p className="font-black">سفارش پرداخت ساخته شد</p>
                        <p className="mt-1 text-xs font-bold">
                            شماره سفارش: {toPersianDigits(checkoutResult.order_id)}. {checkoutResult.message}
                        </p>
                    </div>
                )}

                <div className="sticky bottom-4 z-30 rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                        <div>
                            <p className="text-xs font-bold text-slate-500">انتخاب فعلی</p>
                            <p className="mt-1 text-sm font-black text-slate-950">{selectedPlan?.name || "پلنی انتخاب نشده"}</p>
                        </div>
                        {selectedPlan && (
                            <div className="text-left">
                                <p className="font-latin text-lg font-black text-slate-950" dir="ltr">
                                    {formatPrice(selectedPlan.price)}
                                </p>
                                <p className="text-[11px] font-bold text-slate-400">تومان</p>
                            </div>
                        )}
                    </div>
                    <PrimaryButton
                        type="button"
                        className="w-full"
                        onClick={handleCheckout}
                        disabled={!selectedPlan || isCheckingOut || overview.current_subscription?.plan_id === selectedPlan?.id}
                        leadingIcon={isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    >
                        {overview.current_subscription?.plan_id === selectedPlan?.id
                            ? "این پلن فعال است"
                            : isCheckingOut
                              ? "در حال ساخت سفارش..."
                              : "ادامه و پرداخت"}
                    </PrimaryButton>
                    {!overview.payment.gateway_configured && (
                        <p className="mt-3 text-center text-[11px] font-bold leading-5 text-slate-400">
                            درگاه پرداخت هنوز وصل نشده؛ فعلا فقط سفارش پرداخت آزمایشی ساخته می شود.
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-[20px] border border-white/15 bg-white/[0.10] px-3 py-3 text-center">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-2xl bg-white/15 text-amber-100">
                {icon}
            </div>
            <p className="mt-2 text-[10px] font-bold text-white/55">{label}</p>
            <p className="mt-0.5 text-xs font-black text-white">{value}</p>
        </div>
    );
}

function PlanCard({
    plan,
    selected,
    active,
    onSelect,
}: {
    plan: SubscriptionPlan;
    selected: boolean;
    active: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "w-full rounded-[26px] border p-4 text-right transition",
                selected
                    ? "border-rose-300 bg-rose-50 shadow-[0_16px_36px_rgba(244,63,94,0.14)]"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50",
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-rose-500 bg-rose-500 text-white" : "border-slate-200 bg-white text-transparent",
                )}>
                    <Check size={14} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-950">{planTitle(plan.duration_months)}</h3>
                        {plan.badge && (
                            <span className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-black",
                                plan.is_recommended ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700",
                            )}>
                                {plan.badge}
                            </span>
                        )}
                        {active && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                                فعال
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                        هر ماه حدود {formatPrice(plan.price_per_month)} تومان
                    </p>
                    {plan.savings_percent > 0 && (
                        <p className="mt-2 text-xs font-black text-rose-600">
                            {toPersianDigits(plan.savings_percent)}٪ صرفه جویی نسبت به پرداخت ماهانه
                        </p>
                    )}
                </div>
                <div className="shrink-0 text-left">
                    <p className="font-latin text-lg font-black text-slate-950" dir="ltr">{formatPrice(plan.price)}</p>
                    <p className="text-[11px] font-bold text-slate-400">تومان</p>
                </div>
                <ChevronLeft className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
            </div>
        </button>
    );
}

function planTitle(durationMonths: number) {
    if (durationMonths >= 12) return "اشتراک سالانه";
    if (durationMonths === 3) return "اشتراک سه ماهه";
    if (durationMonths === 1) return "اشتراک یک ماهه";
    return `اشتراک ${toPersianDigits(durationMonths)} ماهه`;
}

function formatPrice(value: number) {
    return toPersianDigits(new Intl.NumberFormat("en-US").format(value));
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
