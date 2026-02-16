"use client";

import React from "react";
import Link from "next/link";

export default function ExplorePage() {
    return (
        <div className="min-h-full bg-gray-50 pb-4" dir="rtl">
            {/* Header - Optional/Simple */}
            <header className="px-4 py-4 sticky top-0 bg-gray-50 z-10">
                <h1 className="text-xl font-bold text-gray-800">کاوش</h1>
            </header>

            <main className="space-y-8 pb-4">
                {/* Section A: Chinese Learning */}
                <section className="px-4">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-gray-800">یادگیری زبان چینی</h2>
                        <button className="text-sm text-blue-600 font-medium hover:text-blue-700">نمایش همه</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { title: "تلفظ", id: "pronunciation", href: "/explore/pronunciation" },
                            { title: "HSK", id: "hsk", href: "/explore/hsk" },
                            { title: "گرامر", id: "grammar", href: "/explore/grammar" },
                            { title: "کاراکتر", id: "characters", href: "/explore/characters" },
                        ].map((item) => (
                            item.href ? (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="aspect-square bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm active:scale-95 transition-transform"
                                >
                                    <span className="text-sm">{item.title}</span>
                                </Link>
                            ) : (
                                <button
                                    key={item.id}
                                    className="aspect-square bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm active:scale-95 transition-transform"
                                >
                                    <span className="text-sm">{item.title}</span>
                                </button>
                            )
                        ))}
                    </div>
                </section>

                {/* Section B: Chinese Entertainment */}
                <section>
                    <div className="px-4 flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-gray-800">سرگرمی چینی</h2>
                        <button className="text-sm text-blue-600 font-medium hover:text-blue-700">نمایش همه</button>
                    </div>
                    <div className="flex overflow-x-auto px-4 gap-3 pb-2 no-scrollbar">
                        {[
                            { title: "سریال", id: "series", href: "/explore/series" },
                            { title: "آشپزی", id: "cooking", href: "/explore/cooking" },
                            { title: "پادکست", id: "podcast" },
                            { title: "موسیقی", id: "music" },
                            { title: "ریالیتی شو", id: "reality", href: "/explore/reality" },
                        ].map((item) => (
                            item.href ? (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="flex-shrink-0 w-28 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold shadow-sm active:scale-95 transition-transform"
                                >
                                    <span className="text-sm text-center px-1 leading-tight">{item.title}</span>
                                </Link>
                            ) : (
                                <button
                                    key={item.id}
                                    className="flex-shrink-0 w-28 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold shadow-sm active:scale-95 transition-transform"
                                >
                                    <span className="text-sm text-center px-1 leading-tight">{item.title}</span>
                                </button>
                            )
                        ))}
                    </div>
                </section>

                {/* Section C: Vocabulary */}
                <section className="px-4">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-gray-800">واژگان</h2>
                        <button className="text-sm text-blue-600 font-medium hover:text-blue-700">نمایش همه</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { title: "واژگان صنعتی", id: "industrial" },
                            { title: "واژگان HSK 1", id: "hsk1" },
                        ].map((item) => (
                            <button
                                key={item.id}
                                className="h-14 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm active:scale-95 transition-transform"
                            >
                                <span className="text-lg">{item.title}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Section D: New/Trending */}
                <section>
                    <div className="px-4 flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-gray-800">تازه ها</h2>
                        <button className="text-sm text-blue-600 font-medium hover:text-blue-700">نمایش همه</button>
                    </div>
                    <div className="flex overflow-x-auto px-4 gap-4 pb-4 no-scrollbar">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex-shrink-0 w-40 flex flex-col gap-2 group cursor-pointer">
                                <div className="w-full aspect-[3/4] bg-gray-200 rounded-2xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                                    {/* Placeholder for thumbnail */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
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
