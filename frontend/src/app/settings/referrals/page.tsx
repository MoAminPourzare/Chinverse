"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Check,
    Copy,
    Gift,
    Loader2,
    Send,
    Share2,
    ShieldCheck,
    Sparkles,
    Ticket,
    UserPlus,
    Users,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { ReferralDashboard, referralService } from "@/services/referral.service";

export default function ReferralSettingsPage() {
    const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<"code" | "link" | null>(null);
    const [applyCode, setApplyCode] = useState("");
    const [applyError, setApplyError] = useState<string | null>(null);
    const [applySuccess, setApplySuccess] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    const inviteLink = useMemo(() => {
        if (!dashboard?.code || typeof window === "undefined") return "";
        return `${window.location.origin}/signup?ref=${dashboard.code}`;
    }, [dashboard?.code]);

    const loadDashboard = async () => {
        try {
            setError(null);
            const data = await referralService.getDashboard();
            setDashboard(data);
        } catch (loadError) {
            console.error("Failed to load referrals", loadError);
            setError("بخش دعوت دوستان باز نشد. لطفاً دوباره تلاش کن.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const copyValue = async (type: "code" | "link", value: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(type);
            window.setTimeout(() => setCopied(null), 1800);
        } catch {
            setCopied(null);
        }
    };

    const shareInvite = async () => {
        if (!dashboard?.code) return;
        const text = `با کد دعوت من وارد چین‌ورس شو: ${dashboard.code}`;
        if (navigator.share && inviteLink) {
            try {
                await navigator.share({
                    title: "دعوت به چین‌ورس",
                    text,
                    url: inviteLink,
                });
                return;
            } catch {
                // User may cancel native share; keep the fallback calm.
            }
        }
        await copyValue("link", inviteLink || dashboard.code);
    };

    const submitApplyCode = async (event: React.FormEvent) => {
        event.preventDefault();
        const normalized = applyCode.trim().toUpperCase().replace(/[-\s]/g, "");
        setApplyError(null);
        setApplySuccess(null);

        if (normalized.length < 4) {
            setApplyError("کد دعوت کوتاه است.");
            return;
        }

        setIsApplying(true);
        try {
            await referralService.applyCode(normalized);
            setApplyCode("");
            setApplySuccess("کد دعوت با موفقیت ثبت شد.");
            await loadDashboard();
        } catch (applyRequestError: unknown) {
            const apiError = applyRequestError as { response?: { data?: { detail?: string } } };
            setApplyError(apiError.response?.data?.detail || "کد دعوت معتبر نیست یا قبلاً ثبت شده است.");
        } finally {
            setIsApplying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                    <span>در حال آماده‌سازی دعوت دوستان...</span>
                </div>
            </div>
        );
    }

    if (error || !dashboard) {
        return (
            <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
                <EmptyState
                    icon={<AlertCircle size={30} />}
                    title="دعوت دوستان باز نشد"
                    description={error || "داده‌ای برای نمایش پیدا نشد."}
                    action={<PrimaryButton onClick={loadDashboard}>تلاش دوباره</PrimaryButton>}
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
                    <h1 className="text-base font-black text-slate-950">دعوت دوستان</h1>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">کد اختصاصی و لینک دعوت</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 text-rose-600">
                    <Gift size={22} />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <section className="overflow-hidden rounded-[32px] border border-slate-900 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                    <div className="relative p-5">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(251,191,36,0.35),transparent_34%),linear-gradient(135deg,#0f172a_0%,#881337_58%,#f97316_135%)]" />
                        <div className="absolute -left-14 bottom-0 h-44 w-44 rounded-full bg-rose-400/25 blur-3xl" />
                        <div className="absolute -right-14 -top-10 h-44 w-44 rounded-full bg-amber-300/25 blur-3xl" />
                        <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black text-amber-100">Invite Program</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">دوستاتو به چین‌ورس دعوت کن</h2>
                                    <p className="mt-3 max-w-[300px] text-sm leading-7 text-white/75">
                                        هر کاربر یک کد اختصاصی دارد. پاداش‌ها بعداً فعال می‌شوند، اما ساختار دعوت از همین حالا آماده است.
                                    </p>
                                </div>
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-white/15 bg-white/[0.12] shadow-inner">
                                    <UserPlus size={28} />
                                </div>
                            </div>

                            <div className="mt-6 rounded-[28px] border border-white/15 bg-white/[0.10] p-4">
                                <p className="text-[11px] font-bold text-white/65">کد دعوت اختصاصی</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-center font-latin text-2xl font-black tracking-[0.22em] text-amber-100" dir="ltr">
                                        {dashboard.code}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => copyValue("code", dashboard.code)}
                                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 transition hover:bg-amber-50"
                                        aria-label="کپی کد دعوت"
                                    >
                                        {copied === "code" ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => copyValue("link", inviteLink)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-50"
                                >
                                    {copied === "link" ? <Check size={17} /> : <Copy size={17} />}
                                    کپی لینک
                                </button>
                                <button
                                    type="button"
                                    onClick={shareInvite}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
                                >
                                    <Share2 size={17} />
                                    اشتراک‌گذاری
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3">
                    <StatCard icon={<Users size={18} />} label="کل دعوت‌ها" value={dashboard.stats.total_invites} />
                    <StatCard icon={<ShieldCheck size={18} />} label="ثبت‌نام‌شده" value={dashboard.stats.joined_count} />
                    <StatCard icon={<Ticket size={18} />} label="پاداش آماده" value={dashboard.stats.ready_rewards} />
                    <StatCard icon={<Gift size={18} />} label="پاداش دریافت‌شده" value={dashboard.stats.claimed_rewards} />
                </section>

                <Surface className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-amber-50 text-amber-600">
                            <Sparkles size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-black text-slate-950">مزایا و پاداش‌ها</h2>
                            <div className="mt-3 space-y-2">
                                {dashboard.benefits.map((benefit) => (
                                    <div key={benefit} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                        <p className="text-xs leading-6 text-slate-600">{benefit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Surface>

                <Surface className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black text-rose-500">ثبت کد دعوت</p>
                            <h2 className="mt-1 text-base font-black text-slate-950">اگر کسی تو را دعوت کرده</h2>
                        </div>
                        <Send className="text-slate-300" size={22} />
                    </div>

                    {dashboard.applied_referral ? (
                        <div className="mt-4 rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-sm font-black text-emerald-800">کد دعوت قبلاً ثبت شده است</p>
                            <p className="mt-1 text-xs leading-6 text-emerald-700">
                                دعوت‌کننده: {dashboard.applied_referral.referrer_name || "کاربر چین‌ورس"}
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={submitApplyCode} className="mt-4 space-y-3">
                            <div className="flex gap-2">
                                <input
                                    value={applyCode}
                                    onChange={(event) => setApplyCode(event.target.value.toUpperCase())}
                                    dir="ltr"
                                    placeholder="CH..."
                                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left font-latin text-sm font-black tracking-[0.12em] text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                                />
                                <button
                                    type="submit"
                                    disabled={isApplying}
                                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}
                                    ثبت
                                </button>
                            </div>
                            {applyError && <p className="text-xs font-bold text-rose-600">{applyError}</p>}
                            {applySuccess && <p className="text-xs font-bold text-emerald-600">{applySuccess}</p>}
                        </form>
                    )}
                </Surface>

                <Surface className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black text-rose-500">آخرین دعوت‌ها</p>
                            <h2 className="mt-1 text-base font-black text-slate-950">دوستانی که با کد تو آمدند</h2>
                        </div>
                        <Users className="text-slate-300" size={22} />
                    </div>

                    {dashboard.recent_invites.length > 0 ? (
                        <div className="mt-4 space-y-2">
                            {dashboard.recent_invites.map((invite) => (
                                <InviteRow key={invite.id} invite={invite} />
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                            <p className="text-sm font-black text-slate-700">هنوز دعوتی ثبت نشده</p>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                                لینک دعوتت را برای دوستان بفرست تا اینجا نمایش داده شوند.
                            </p>
                        </div>
                    )}
                </Surface>
            </main>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <Surface className="p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-rose-50 text-rose-600">
                    {icon}
                </div>
                <div>
                    <p className="text-[11px] font-bold text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{toPersianDigits(value)}</p>
                </div>
            </div>
        </Surface>
    );
}

function InviteRow({ invite }: { invite: { display_name: string | null; avatar_url: string | null; created_at: string; reward_status: string } }) {
    const image = getMediaUrl(invite.avatar_url);
    return (
        <div className="flex items-center gap-3 rounded-[22px] border border-slate-100 bg-slate-50 p-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-white text-slate-400">
                {image ? (
                    <Image src={image} alt={invite.display_name || "کاربر"} fill className="object-cover" sizes="44px" unoptimized />
                ) : (
                    <UserPlus size={18} />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-800">{invite.display_name || "کاربر چین‌ورس"}</p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-400">{formatDate(invite.created_at)}</p>
            </div>
            <span className={cn(
                "rounded-full px-3 py-1 text-[11px] font-black",
                invite.reward_status === "claimed"
                    ? "bg-emerald-100 text-emerald-700"
                    : invite.reward_status === "ready"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500",
            )}>
                {rewardLabel(invite.reward_status)}
            </span>
        </div>
    );
}

function rewardLabel(value: string) {
    if (value === "claimed") return "دریافت‌شده";
    if (value === "ready") return "آماده";
    return "در انتظار";
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("fa-IR", {
        month: "short",
        day: "numeric",
    });
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
