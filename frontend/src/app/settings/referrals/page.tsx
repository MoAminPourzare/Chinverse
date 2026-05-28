"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Copy, Loader2, Share2 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { AppHeader } from "@/components/ui/IconButton";
import { ReferralDashboard, referralService } from "@/services/referral.service";

const inviteIcon = "/assets/chinverse/icons/invite friends.svg";

export default function ReferralSettingsPage() {
    const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<"code" | "link" | null>(null);

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
                    title: "دعوت به چین ورس",
                    text,
                    url: inviteLink,
                });
                return;
            } catch {
                // User may cancel native share; fall back to copying the link.
            }
        }
        await copyValue("link", inviteLink || dashboard.code);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#155aa6]" />
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
            <AppHeader
                title="دعوت دوستان"
                backHref="/settings"
                iconClassName="bg-transparent shadow-none ring-0"
                icon={<Image src={inviteIcon} alt="" width={32} height={32} className="h-8 w-8 object-contain" />}
            />

            <main className="mx-auto flex w-full max-w-[430px] flex-col">
                <p className="text-sm font-semibold leading-8 text-[#2f3238]">
                    با دعوت دوستانت به چین ورس هم به رشد جامعه زبان‌آموزان چینی کمک می‌کنی هم امتیاز می‌گیری.
                </p>

                <div className="my-7 flex justify-center">
                    <Image src={inviteIcon} alt="" width={176} height={176} className="h-44 w-44 object-contain" />
                </div>

                <div className="rounded-[10px] bg-[#e3e6ec] px-4 py-5 text-center">
                    <p className="text-[13px] font-black text-[#2f3238]">این کد رو برای دوستانت بفرست تا تو چین ورس ثبت نام کنن.</p>
                    <button
                        type="button"
                        onClick={() => copyValue("code", dashboard.code)}
                        className="mx-auto mt-4 flex min-w-[170px] items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#155aa6] bg-[#eef3fb] px-4 py-3 font-latin text-[12px] font-black tracking-[0.08em] text-[#2f3238]"
                        dir="ltr"
                        aria-label="کپی کد دعوت"
                    >
                        <span>{dashboard.code}</span>
                        {copied === "code" ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} className="text-[#155aa6]" />}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={shareInvite}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#155aa6] px-4 py-3.5 text-sm font-black text-white shadow-[0_10px_20px_rgba(21,90,166,0.26)] transition hover:bg-[#0f4e92]"
                >
                    <Share2 size={17} />
                    دعوت از دوستان
                </button>
            </main>
        </div>
    );
}
