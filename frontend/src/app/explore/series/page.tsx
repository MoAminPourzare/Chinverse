"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Star } from "lucide-react";
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

// Mock series data
const mockSeries = [
    {
        id: 301,
        title: "Reset / 开端",
        episodes: 15,
        rating: 4.8,
        year: 2022,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Reset_2022_Poster.jpg/220px-Reset_2022_Poster.jpg",
        progress: 2,
    },
    {
        id: 302,
        title: "The Untamed / 陈情令",
        episodes: 50,
        rating: 4.9,
        year: 2019,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/5/52/The_Untamed_web_series_poster.jpg/220px-The_Untamed_web_series_poster.jpg",
        progress: 0,
    },
    {
        id: 303,
        title: "Go Ahead / 以家人之名",
        episodes: 40,
        rating: 4.7,
        year: 2020,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Go_Ahead_TV_series_poster.jpg/220px-Go_Ahead_TV_series_poster.jpg",
        progress: 0,
    },
    {
        id: 304,
        title: "Love O2O / 微微一笑很倾城",
        episodes: 30,
        rating: 4.6,
        year: 2016,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/6/66/Love_O2O_poster.jpg/220px-Love_O2O_poster.jpg",
        progress: 10,
    },
];

export default function SeriesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch real data but fallback to mocks
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=series`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // Combine real and mock data (priority to real)
    // For now, just using mocks as primary since backend data likely doesn't exist yet
    const displaySeries = mockSeries;

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">سریال‌ها</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displaySeries.map((series) => (
                            <Link
                                key={series.id}
                                href={`/series/${series.id}`}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                            >
                                {/* Portrait Poster */}
                                <div className="aspect-[2/3] bg-gray-200 relative">
                                    <img
                                        src={series.poster}
                                        alt={series.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

                                    {/* Episode Count Badge */}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {series.episodes} قسمت
                                    </div>

                                    {/* Progress Bar (if started) */}
                                    {series.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${(series.progress / series.episodes) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                                            {series.title}
                                        </h3>
                                        <p className="text-xs text-gray-500">{series.year}</p>
                                    </div>

                                    <div className="flex items-center gap-1 mt-2">
                                        <Star size={12} className="text-orange-400 fill-orange-400" />
                                        <span className="text-xs text-gray-600">{series.rating}</span>
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
