'use client';

import { BookOpenText, Globe2, Instagram, MessageCircle, Sparkles, UsersRound } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Surface from '@/components/ui/Surface';

const highlights = [
    {
        title: 'آموزش زبان',
        description: 'درس‌ها، ویدیوها، تمرین واژگان و مسیرهای سطح‌بندی‌شده برای یادگیری چینی.',
        icon: BookOpenText,
    },
    {
        title: 'فرهنگ و سرگرمی',
        description: 'فیلم، سریال، موسیقی، داستان، متون کلاسیک و محتوای فرهنگی برای درک عمیق‌تر.',
        icon: Globe2,
    },
    {
        title: 'جامعه و همکاری',
        description: 'پروفایل، ویترین، خدمات، گفتگو و ارتباط با آدم‌های فعال در حوزه زبان چینی.',
        icon: UsersRound,
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <PageHeader title="درباره چین‌ورس" subtitle="یک فضای یادگیری برای زبان و فرهنگ چینی" backHref="/profile" />

            <main className="mx-auto mt-5 flex w-full max-w-5xl flex-col gap-5">
                <Surface className="overflow-hidden bg-slate-950 text-white">
                    <div className="relative p-6 sm:p-8">
                        <div className="absolute -left-16 top-0 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl" />
                        <div className="absolute -bottom-20 right-12 h-52 w-52 rounded-full bg-emerald-400/15 blur-3xl" />
                        <div className="relative max-w-3xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/75">
                                <Sparkles size={15} />
                                ChinVerse
                            </div>
                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                                چین‌ورس فقط یک کلاس آنلاین نیست؛ یک مسیر کامل برای زندگی کردن با زبان چینی است.
                            </h1>
                            <p className="mt-4 text-sm leading-8 text-white/70">
                                اینجا می‌توانی زبان چینی یاد بگیری، محتوای واقعی ببینی، دایره واژگان خودت را بسازی، با دیگران ارتباط بگیری و کم‌کم پروفایل تخصصی خودت را در این حوزه کامل کنی.
                            </p>
                        </div>
                    </div>
                </Surface>

                <div className="grid gap-4 md:grid-cols-3">
                    {highlights.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Surface key={item.title} as="article" className="p-5">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[20px] bg-gradient-to-br from-rose-50 to-amber-50 text-rose-500">
                                    <Icon size={23} />
                                </div>
                                <h2 className="text-base font-bold text-slate-950">{item.title}</h2>
                                <p className="mt-2 text-sm leading-7 text-slate-500">{item.description}</p>
                            </Surface>
                        );
                    })}
                </div>

                <Surface className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-950">با چین‌ورس زبان چینی را وارد زندگی روزمره کن.</h2>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                            هدف این پروژه ساختن یک تجربه منظم، قابل توسعه و کاربردی برای فارسی‌زبان‌هایی است که می‌خواهند زبان و فرهنگ چینی را عمیق‌تر دنبال کنند.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <PrimaryButton href="/explore" leadingIcon={<BookOpenText size={18} />}>
                            شروع یادگیری
                        </PrimaryButton>
                        <PrimaryButton
                            href="https://instagram.com/chinverse"
                            variant="ghost"
                            leadingIcon={<Instagram size={18} />}
                        >
                            اینستاگرام
                        </PrimaryButton>
                        <PrimaryButton href="/support" variant="ghost" leadingIcon={<MessageCircle size={18} />}>
                            پشتیبانی
                        </PrimaryButton>
                    </div>
                </Surface>
            </main>
        </div>
    );
}
