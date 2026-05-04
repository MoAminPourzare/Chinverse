"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HSKLevelPage() {
    const levels = [
        { level: 1, color: "bg-yellow-400", title: "HSK 1", subtitle: "150 Words" },
        { level: 2, color: "bg-teal-500", title: "HSK 2", subtitle: "300 Words" },
        { level: 3, color: "bg-orange-500", title: "HSK 3", subtitle: "600 Words" },
        { level: 4, color: "bg-red-600", title: "HSK 4", subtitle: "1200 Words" },
        { level: 5, color: "bg-blue-600", title: "HSK 5", subtitle: "2500 Words" },
        { level: 6, color: "bg-purple-600", title: "HSK 6", subtitle: "5000 Words" },
    ];

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">HSK</h1>
            </header>

            <main className="p-4 grid grid-cols-2 gap-4">
                {levels.map((item) => (
                    <Link
                        key={item.level}
                        href={`/hsk/${item.level}`}
                        className={`aspect-[4/5] ${item.color} rounded-2xl flex flex-col items-center justify-center text-white shadow-md active:scale-95 transition-transform`}
                    >
                        <span className="text-xs opacity-90 mb-1">Standard Course</span>
                        <span className="text-4xl font-bold mb-2">{item.title}</span>
                        <span className="text-xs opacity-90">{item.subtitle}</span>
                    </Link>
                ))}
            </main>
        </div>
    );
}
