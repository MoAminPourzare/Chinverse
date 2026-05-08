'use client';

import Link from "next/link";
import { Bell, CircleHelp, Info, LogIn, Shield, UserRound } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Surface from "@/components/ui/Surface";

const settingLinks = [
    { title: "حساب کاربری", description: "اطلاعات ورود و مشخصات اصلی", href: "/account", icon: UserRound },
    { title: "اعلان‌ها", description: "پیام‌ها و خبرهای مربوط به فعالیت‌ها", href: "/notifications", icon: Bell },
    { title: "پشتیبانی", description: "ارسال پیام به تیم چین‌ورس", href: "/support", icon: CircleHelp },
    { title: "درباره چین‌ورس", description: "معرفی کوتاه محصول و مسیر ارتباطی", href: "/about", icon: Info },
];

export default function SettingsPage() {
    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <PageHeader title="تنظیمات" subtitle="مدیریت حساب و مسیرهای کمکی" backHref="/profile" />

            <main className="mx-auto mt-5 flex w-full max-w-3xl flex-col gap-4">
                <Surface className="overflow-hidden bg-slate-950 p-5 text-white">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-white/10 text-amber-200">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">مرکز تنظیمات چین‌ورس</h1>
                            <p className="mt-2 text-sm leading-7 text-white/65">
                                بخش‌های اصلی حساب از اینجا قابل دسترسی هستند.
                            </p>
                        </div>
                    </div>
                </Surface>

                <div className="grid gap-3 sm:grid-cols-2">
                    {settingLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-[26px] border border-white/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 text-rose-500">
                                        <Icon size={21} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-950">{item.title}</h2>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <EmptyState
                    icon={<LogIn size={30} />}
                    title="ورود و ثبت‌نام"
                    description="اگر از حساب خارج شده‌ای، از مسیر ورود یا ثبت‌نام دوباره وارد برنامه شو."
                    action={
                        <div className="flex flex-wrap justify-center gap-2">
                            <Link className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800" href="/login">
                                ورود
                            </Link>
                            <Link className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50" href="/signup">
                                ثبت‌نام
                            </Link>
                        </div>
                    }
                />
            </main>
        </div>
    );
}
