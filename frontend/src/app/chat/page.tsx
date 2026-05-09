"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Search, Sparkles } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function ChatPage() {
    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                <div className="relative p-5">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_46%,#334155_100%)]" />
                    <div className="absolute -left-12 top-0 h-44 w-44 rounded-full bg-rose-500/30 blur-3xl" />
                    <div className="absolute -bottom-20 right-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="absolute left-16 bottom-2 h-28 w-28 rounded-full bg-amber-300/15 blur-3xl" />
                    <div className="relative">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <Link
                                href="/profile"
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                                aria-label="بازگشت"
                            >
                                <ArrowRight size={19} />
                            </Link>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                                <Sparkles size={14} />
                                پیام ها
                            </div>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">گفت وگوهای چین ورس</h1>
                        <p className="mt-3 text-sm leading-7 text-white/72">
                            پیام های خصوصی، درخواست های همکاری و ارتباط با کاربران از این بخش مدیریت می شود.
                        </p>
                        <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/15 bg-white/10 px-4 py-3 text-white/60 backdrop-blur">
                            <Search size={18} />
                            <span className="text-xs font-medium">برای شروع گفتگو از ویترین یا پروفایل کاربران وارد شوید</span>
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto mt-5 w-full max-w-2xl">
                <EmptyState
                    icon={<MessageCircle size={30} />}
                    title="گفت وگویی انتخاب نشده است"
                    description="برای شروع پیام، از صفحه ویترین وارد پروفایل یا خدمت موردنظر شو."
                    action={<PrimaryButton href="/showcase">رفتن به ویترین</PrimaryButton>}
                />
            </main>
        </div>
    );
}
