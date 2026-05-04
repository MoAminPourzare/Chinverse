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

// Mock cartoons/animation data
const mockCartoons = [
    {
        id: 501,
        title: "Ne Zha / 哪吒之魔童降世",
        episodes: 1,
        rating: 4.8,
        year: 2019,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/Ne_Zha_%282019_film%29_poster.png/220px-Ne_Zha_%282019_film%29_poster.png",
        progress: 0,
    },
    {
        id: 502,
        title: "White Snake / 白蛇：缘起",
        episodes: 1,
        rating: 4.6,
        year: 2019,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/d/de/White_Snake_%28film%29_poster.jpg/220px-White_Snake_%28film%29_poster.jpg",
        progress: 0,
    },
    {
        id: 503,
        title: "Big Fish & Begonia / 大鱼海棠",
        episodes: 1,
        rating: 4.5,
        year: 2016,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Big_Fish_%26_Begonia_poster.jpg/220px-Big_Fish_%26_Begonia_poster.jpg",
        progress: 0,
    },
];

export default function CartoonsExplorePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=cartoons`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch cartoons:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const displayCartoons = mockCartoons;

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">کارتون و انیمیشن</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displayCartoons.map((cartoon) => (
                            <Link
                                key={cartoon.id}
                                href={`/cartoons/${cartoon.id}`}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                            >
                                {/* Portrait Poster */}
                                <div className="aspect-[2/3] bg-gray-200 relative">
                                    <img
                                        src={cartoon.poster}
                                        alt={cartoon.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

                                    {/* Year Badge */}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {cartoon.year}
                                    </div>

                                    {/* Progress Bar (if started) */}
                                    {cartoon.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                                            <div
                                                className="h-full bg-purple-500"
                                                style={{ width: `${cartoon.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                                            {cartoon.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-1 mt-2">
                                        <Star size={12} className="text-orange-400 fill-orange-400" />
                                        <span className="text-xs text-gray-600">{cartoon.rating}</span>
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
