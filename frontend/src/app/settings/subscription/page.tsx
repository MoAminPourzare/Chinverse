"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
    AlertCircle,
    Check,
    ChevronLeft,
    CreditCard,
    Loader2,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { AppHeader } from "@/components/ui/IconButton";
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
            <div className="motion-list flex min-h-full items-center justify-center bg-[#f7f8fb]" dir="rtl">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#155aa6]" />
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
            <AppHeader
                title="مدیریت اشتراک"
                backHref="/settings"
                iconClassName="bg-transparent shadow-none ring-0"
                icon={<Image src="/assets/chinverse/icons/Membership.svg" alt="" width={31} height={31} className="h-8 w-8 object-contain" />}
            />

            <main className="motion-list mx-auto flex w-full max-w-2xl flex-col gap-4">
                {overview.current_subscription ? (
                    <section className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                        <div className="mt-4 rounded-[20px] border border-emerald-100 bg-emerald-50 p-4">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <ShieldCheck size={18} />
                                <p className="text-sm font-black">اشتراک فعال داری</p>
                            </div>
                            <p className="mt-2 text-xs leading-6 text-emerald-700">
                                {overview.current_subscription.plan_name} تا {formatDate(overview.current_subscription.end_date)} فعال است.
                                {overview.current_subscription.days_remaining > 0
                                    ? ` ${toPersianDigits(overview.current_subscription.days_remaining)} روز باقی مانده.`
                                    : ""}
                            </p>
                        </div>
                    </section>
                ) : null}

                <Surface className="overflow-hidden border-[#155aa6] bg-[#eef0f4] p-0 shadow-[0_18px_48px_rgba(21,90,166,0.08)]">
                    <div className="border-b border-[#155aa6]/20 px-5 py-5 text-center">
                        <h2 className="text-[24px] font-black text-[#155aa6]">انواع اشتراک</h2>
                    </div>
                    <div className="motion-list space-y-3 p-4">
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

                <Surface className="border-[#155aa6]/25 bg-[#eef0f4] p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-amber-50 text-amber-600">
                            <Sparkles size={21} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-black text-slate-950">امکانات این بسته</h2>
                            <div className="mt-3 space-y-2">
                                {overview.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                                        <Check className="mt-1 h-4 w-4 shrink-0 text-[#e88462]" />
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
                    ? "border-[#155aa6] bg-white shadow-[0_12px_26px_rgba(21,90,166,0.12)] ring-2 ring-[#e88462]/25"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50",
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-[#155aa6] bg-[#155aa6] text-white" : "border-slate-200 bg-white text-transparent",
                )}>
                    <Check size={14} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-950">{planTitle(plan.duration_months)}</h3>
                        {plan.badge && (
                            <span className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-black",
                                plan.is_recommended ? "bg-[#e88462] text-white" : "bg-blue-50 text-blue-700",
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
                        هر ماه {formatPrice(plan.price_per_month)} تومان
                    </p>
                    {plan.savings_percent > 0 && (
                        <p className="mt-2 text-xs font-black text-[#155aa6]">
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
