"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Compass, Globe2, HeartHandshake, MessageCircle, Sparkles, UsersRound } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";

const highlights = [
    {
        title: "یادگیری مرحله‌به‌مرحله",
        description: "دوره‌ها، درس‌ها، ویدیوها و تمرین‌های واژگان کنار هم قرار گرفته‌اند تا مسیر یادگیری روشن و قابل ادامه باشد.",
        icon: BookOpenText,
        tone: "from-rose-50 to-orange-50 text-rose-600",
    },
    {
        title: "زندگی با زبان چینی",
        description: "فیلم، سریال، موسیقی، داستان، فرهنگ و محتوای واقعی کمک می‌کند زبان را فقط حفظ نکنی، بلکه تجربه کنی.",
        icon: Globe2,
        tone: "from-sky-50 to-cyan-50 text-sky-700",
    },
    {
        title: "جامعه و همکاری",
        description: "پروفایل، ویترین، خدمات و گفتگو کمک می‌کنند با آدم‌های فعال در حوزه زبان چینی ارتباط بگیری.",
        icon: UsersRound,
        tone: "from-emerald-50 to-teal-50 text-emerald-700",
    },
];

export default function SettingsAboutPage() {
    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <main className="mx-auto mt-5 flex w-full max-w-2xl flex-col gap-4">
                <Surface className="overflow-hidden border-slate-900 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#334155_100%)] p-0 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <div className="relative overflow-hidden p-5">
                        <div className="absolute -left-16 -top-14 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl" />
                        <div className="absolute -bottom-20 right-10 h-52 w-52 rounded-full bg-sky-400/15 blur-3xl" />
                        <div className="relative">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <Link
                                    href="/settings"
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 transition hover:bg-white/15 hover:text-white"
                                    aria-label="بازگشت به تنظیمات"
                                >
                                    <ArrowRight size={19} />
                                </Link>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-white/80">
                                    <Sparkles size={15} />
                                    ChinVerse
                                </div>
                            </div>
                            <h1 className="text-2xl font-black leading-10 tracking-tight text-white">
                                چین‌ورس یک مسیر کامل برای یادگیری و زندگی کردن با زبان چینی است.
                            </h1>
                            <p className="mt-4 text-sm leading-8 text-white/72">
                                اینجا می‌توانی زبان چینی یاد بگیری، محتوای واقعی ببینی، دایره واژگان خودت را بسازی، با دیگران ارتباط بگیری و کم‌کم پروفایل تخصصی خودت را در این حوزه کامل کنی.
                            </p>
                        </div>
                    </div>
                </Surface>

                <div className="grid gap-3">
                    {highlights.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Surface key={item.title} as="article" className="flex items-start gap-4 border-white bg-white/95 p-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br ${item.tone}`}>
                                    <Icon size={23} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                                    <p className="mt-1 text-sm leading-7 text-slate-500">{item.description}</p>
                                </div>
                            </Surface>
                        );
                    })}
                </div>

                <Surface className="overflow-hidden border-white bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-white/10 text-amber-200">
                            <HeartHandshake size={23} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-black leading-8">هدف محصول</h2>
                            <p className="mt-2 text-sm leading-8 text-white/70">
                                ساختن یک تجربه منظم، قابل توسعه و کاربردی برای فارسی‌زبان‌هایی که می‌خواهند زبان و فرهنگ چینی را عمیق‌تر دنبال کنند.
                            </p>
                        </div>
                    </div>
                </Surface>

                <div className="grid gap-3 sm:grid-cols-2">
                    <PrimaryButton href="/explore" leadingIcon={<Compass size={18} />}>
                        رفتن به کاوش
                    </PrimaryButton>
                    <PrimaryButton href="/support" variant="ghost" leadingIcon={<MessageCircle size={18} />}>
                        پشتیبانی
                    </PrimaryButton>
                </div>
            </main>
        </div>
    );
}
