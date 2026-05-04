"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import api from "@/lib/api";

interface Course {
    id: number;
    title: string;
    description: string;
    cover_image_url: string;
    level: string;
    sections?: Array<{
        lessons?: Array<{ id: number }>;
    }>;
}

// Mock reality shows
const mockRealityShows = [
    {
        id: 1101,
        title: "Keep Running / 奔跑吧",
        episodes: 72,
        rating: 4.5,
        year: 2014,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Keep_Running_%28Chinese_TV_series%29.jpg/220px-Keep_Running_%28Chinese_TV_series%29.jpg",
        progress: 0,
    },
    {
        id: 1102,
        title: "Go Fighting! / 极限挑战",
        episodes: 60,
        rating: 4.6,
        year: 2015,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/0/06/Go_Fighting%21_Season_1.jpg/220px-Go_Fighting%21_Season_1.jpg",
        progress: 0,
    },
    {
        id: 1103,
        title: "Day Day Up / 天天向上",
        episodes: 200,
        rating: 4.4,
        year: 2008,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Day_Day_Up.jpg/220px-Day_Day_Up.jpg",
        progress: 0,
    },
];

export default function RealityExplorePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=reality`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch reality shows:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const displayShows = mockRealityShows;

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">ریالیتی شو</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displayShows.map((show) => (
                            <Link
                                key={show.id}
                                href={`/reality/${show.id}`}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                            >
                                {/* Portrait Poster */}
                                <div className="aspect-[2/3] bg-gray-200 relative">
                                    <img src={show.poster} alt={show.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {show.year}
                                    </div>
                                    {show.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                                            <div className="h-full bg-pink-500" style={{ width: `${show.progress}%` }} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                                            {show.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Star size={12} className="text-orange-400 fill-orange-400" />
                                        <span className="text-xs text-gray-600">{show.rating}</span>
                                        <span className="text-gray-300 text-xs mx-1">|</span>
                                        <span className="text-xs text-gray-500">{show.episodes} قسمت</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
