"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Headphones, PencilLine, Play, Sparkles } from "lucide-react";
import Surface from "@/components/ui/Surface";
import SectionHeader from "@/components/ui/SectionHeader";

const learningItems = [
    { title: "HSK", id: "hsk", href: "/explore/hsk", icon: BookOpen, color: "from-amber-500 to-orange-500" },
    { title: "تلفظ", id: "pronunciation", href: "/explore/pronunciation", icon: Play, color: "from-sky-500 to-cyan-500" },
    { title: "کاراکتر", id: "characters", href: "/explore/characters", icon: PencilLine, color: "from-violet-500 to-indigo-600" },
    { title: "گرامر", id: "grammar", href: "/explore/grammar", icon: Sparkles, color: "from-emerald-500 to-teal-500" },
    { title: "اصطلاح", id: "idioms", href: "/explore/idioms", icon: Flame, color: "from-rose-500 to-orange-500" },
    { title: "چینی کاربردی", id: "practical", href: "/explore/practical", icon: Headphones, color: "from-cyan-600 to-sky-600" },
    { title: "یادگیری با ولاگ", id: "vlogs", href: "/explore/vlogs", icon: Sparkles, color: "from-amber-600 to-orange-600" },
    { title: "واژگان هم‌معنی", id: "synonyms", href: "/explore/synonyms", icon: BookOpen, color: "from-sky-600 to-blue-600" },
    { title: "زبان چینی کلاسیک", id: "classical", href: "/explore/classical", icon: PencilLine, color: "from-slate-700 to-slate-900" },
];

const entertainmentItems = [
    { title: "سریال", id: "series", href: "/explore/series", icon: Play, color: "from-rose-500 to-pink-500" },
    { title: "فیلم", id: "movies", href: "/explore/movies", icon: Play, color: "from-red-500 to-orange-500" },
    { title: "کارتون و انیمیشن", id: "cartoons", href: "/explore/cartoons", icon: Sparkles, color: "from-violet-500 to-fuchsia-500" },
    { title: "پادکست", id: "podcasts", href: "/explore/podcasts", icon: Headphones, color: "from-indigo-500 to-sky-500" },
    { title: "موسیقی", id: "music", href: "/explore/music", icon: Flame, color: "from-teal-500 to-emerald-500" },
    { title: "گفتارهای موضوعی", id: "topic-talks", href: "/explore/topic-talks", icon: BookOpen, color: "from-fuchsia-500 to-rose-500" },
];

const artSkillItems = [
    { title: "آشپزی", id: "arts-cooking", href: "/explore/arts-cooking", icon: Flame, color: "from-orange-500 to-amber-500" },
    { title: "هنرهای رزمی", id: "martial-arts", href: "/explore/martial-arts", icon: Sparkles, color: "from-red-500 to-rose-600" },
    { title: "تمرینات انرژی و سلامت", id: "energy-health", href: "/explore/energy-health", icon: Headphones, color: "from-emerald-500 to-teal-600" },
    { title: "خطاطی", id: "calligraphy", href: "/explore/calligraphy", icon: PencilLine, color: "from-indigo-500 to-violet-600" },
    { title: "فرهنگ چای", id: "tea-culture", href: "/explore/tea-culture", icon: BookOpen, color: "from-amber-700 to-orange-700" },
];

const cultureThoughtItems = [
    { title: "متون کلاسیک آموزشی", id: "culture-texts", href: "/explore/culture-texts", icon: BookOpen, color: "from-slate-700 to-slate-900" },
    { title: "داستان‌های تاریخی", id: "historical-stories", href: "/explore/historical-stories", icon: Sparkles, color: "from-stone-600 to-zinc-700" },
    { title: "شعر و ادبیات کلاسیک", id: "classical-poetry", href: "/explore/classical-poetry", icon: PencilLine, color: "from-violet-500 to-purple-600" },
    { title: "آیین‌ها و جشن‌ها", id: "festivals-customs", href: "/explore/festivals-customs", icon: Flame, color: "from-fuchsia-500 to-rose-500" },
];

const sectionBlocks = [
    { title: "یادگیری زبان چینی", subtitle: "مسیرهای پایه برای آموزش، تمرین و ساختن عادت روزانه.", items: learningItems },
    { title: "سرگرمی چینی", subtitle: "دوره‌های دیدنی برای یادگیری در متن فیلم، سریال و صدا.", items: entertainmentItems },
    { title: "هنر و مهارت‌های چینی", subtitle: "دوره‌های فرهنگی و کاربردی برای تجربه‌های عمیق‌تر.", items: artSkillItems },
    { title: "فرهنگ و اندیشه چینی", subtitle: "خواندن و دیدن محتواهای کلاسیک و فرهنگی.", items: cultureThoughtItems },
];

export default function ExplorePage() {
    return (
        <div className="min-h-full pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
                <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#334155_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <div className="p-5 sm:p-6">
                        <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/80">
                            Explore
                        </div>
                        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">کاوش</p>
                                <h1 className="mt-2 text-3xl font-bold tracking-tight">مسیر مناسب خودت را پیدا کن</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                                    همه‌ی دسته‌ها در چهار بخش منظم چیده شده‌اند تا سریع‌تر به درس‌ها، ویدیوها و مسیرهای آموزشی برسی.
                                </p>
                            </div>
                            <Link
                                href="/community"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/15"
                            >
                                جامعه و گفتگو
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </Surface>

                {sectionBlocks.map((section) => (
                    <section key={section.title} className="space-y-3">
                        <SectionHeader title={section.title} subtitle={section.subtitle} actionLabel="همه" actionHref="/explore" />
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link key={item.id} href={item.href} className="group">
                                        <Surface className="h-full p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
                                            <div className={`inline-flex rounded-2xl bg-gradient-to-br ${item.color} p-3 text-white shadow-lg`}>
                                                <Icon size={18} />
                                            </div>
                                            <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900">{item.title}</h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                ورود مستقیم به {item.title} و درس‌های مربوط به آن.
                                            </p>
                                        </Surface>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                ))}

                <section className="space-y-3">
                    <SectionHeader title="تازه‌ها" subtitle="آخرین ویدیوها و محتواهای اضافه‌شده را مرور کن." actionLabel="نمایش همه" actionHref="/community" />
                    <div className="grid gap-4 md:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <Surface key={item} className="overflow-hidden">
                                <div className="aspect-[4/3] bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)]" />
                                <div className="p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-500">تازه</span>
                                        <span>ویدیوی شماره {item}</span>
                                    </div>
                                    <h3 className="mt-3 text-sm font-bold text-slate-900">محتوای نمونه برای طراحی جدید</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        این بخش برای نمایش کارت‌های جدید و مرتب‌شده در صفحه‌ی کاوش است.
                                    </p>
                                </div>
                            </Surface>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
