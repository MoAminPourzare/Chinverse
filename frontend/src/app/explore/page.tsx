"use client";

import React from "react";
import Link from "next/link";

const learningItems = [
    { title: "HSK", id: "hsk", href: "/explore/hsk" },
    { title: "تلفظ", id: "pronunciation", href: "/explore/pronunciation" },
    { title: "کاراکتر", id: "characters", href: "/explore/characters" },
    { title: "گرامر", id: "grammar", href: "/explore/grammar" },
    { title: "اصطلاح", id: "idioms", href: "/explore/idioms" },
    { title: "چینی کاربردی", id: "practical", href: "/explore/practical" },
    { title: "یادگیری با ولاگ", id: "vlogs", href: "/explore/vlogs" },
    { title: "واژگان هم معنی", id: "synonyms", href: "/explore/synonyms" },
    { title: "زبان چینی کلاسیک", id: "classical", href: "/explore/classical" },
];

const entertainmentItems = [
    { title: "سریال", id: "series", href: "/explore/series" },
    { title: "فیلم", id: "movies", href: "/explore/movies" },
    { title: "کارتون و انیمیشن", id: "cartoons", href: "/explore/cartoons" },
    { title: "پادکست", id: "podcasts", href: "/explore/podcasts" },
    { title: "موسیقی", id: "music", href: "/explore/music" },
    { title: "گفتارهای موضوعی", id: "topic-talks", href: "/explore/topic-talks" },
];

const artSkillItems = [
    { title: "آشپزی", id: "arts-cooking", href: "/explore/arts-cooking" },
    { title: "هنرهای رزمی", id: "martial-arts", href: "/explore/martial-arts" },
    { title: "تمرینات انرژی و سلامت", id: "energy-health", href: "/explore/energy-health" },
    { title: "خطاطی", id: "calligraphy", href: "/explore/calligraphy" },
    { title: "فرهنگ چای", id: "tea-culture", href: "/explore/tea-culture" },
];

const cultureThoughtItems = [
    { title: "متون کلاسیک آموزشی", id: "culture-texts", href: "/explore/culture-texts" },
    { title: "داستان‌های تاریخی", id: "historical-stories", href: "/explore/historical-stories" },
    { title: "شعر و ادبیات کلاسیک", id: "classical-poetry", href: "/explore/classical-poetry" },
    { title: "آیین‌ها و جشن‌ها", id: "festivals-customs", href: "/explore/festivals-customs" },
];

export default function ExplorePage() {
    return (
        <div className="min-h-full bg-gray-50 pb-4" dir="rtl">
            <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/90 backdrop-blur">
                <div className="px-4 py-4">
                    <h1 className="text-xl font-bold text-gray-900">کاوش</h1>
                </div>
            </header>

            <main className="space-y-6 pb-4 pt-4">
                <section className="px-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-gray-900">یادگیری زبان چینی</h2>
                        <button className="text-sm font-medium text-sky-600 hover:text-sky-700">نمایش همه</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                        {learningItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex-shrink-0 w-36 h-24 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center px-2"
                            >
                                <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="px-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-gray-900">سرگرمی چینی</h2>
                        <button className="text-sm font-medium text-sky-600 hover:text-sky-700">نمایش همه</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                        {entertainmentItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex-shrink-0 w-36 h-24 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center px-2"
                            >
                                <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="px-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-gray-900">هنر و مهارت‌های چینی</h2>
                        <button className="text-sm font-medium text-sky-600 hover:text-sky-700">نمایش همه</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                        {artSkillItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex-shrink-0 w-36 h-24 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center px-2"
                            >
                                <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="px-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-gray-900">فرهنگ و اندیشه چینی</h2>
                        <button className="text-sm font-medium text-sky-600 hover:text-sky-700">نمایش همه</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                        {cultureThoughtItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="flex-shrink-0 w-36 h-24 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center px-2"
                            >
                                <span className="text-sm font-semibold text-gray-800 text-center leading-tight">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="px-4 flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-gray-900">تازه‌ها</h2>
                        <button className="text-sm font-medium text-sky-600 hover:text-sky-700">نمایش همه</button>
                    </div>
                    <div className="flex overflow-x-auto px-4 gap-4 pb-4 no-scrollbar">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex-shrink-0 w-40 flex flex-col gap-2 group cursor-pointer">
                                <div className="w-full aspect-[3/4] bg-white border border-gray-200 rounded-2xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                                        <span className="text-xs font-medium">Thumbnail</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="h-3 w-20 bg-gray-200 rounded" />
                                        <div className="h-2 w-12 bg-gray-100 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
