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

// Mock cooking shows/channels
const mockCooking = [
    {
        id: 901,
        title: "Chef Wang / 美食作家王刚",
        episodes: 120,
        rating: 4.9,
        year: 2017,
        poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Chinese_cuisine_montage.png/220px-Chinese_cuisine_montage.png",
        progress: 0,
    },
    {
        id: 902,
        title: "A Bite of China / 舌尖上的中国",
        episodes: 21,
        rating: 4.8,
        year: 2012,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/A_Bite_of_China.jpg/220px-A_Bite_of_China.jpg",
        progress: 0,
    },
    {
        id: 903,
        title: "Li Ziqi / 李子柒",
        episodes: 80,
        rating: 4.7,
        year: 2016,
        poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Chinese_food.jpg/220px-Chinese_food.jpg",
        progress: 0,
    },
];

export default function CookingExplorePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=cooking`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch cooking:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const displayCooking = mockCooking;

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">آشپزی</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displayCooking.map((show) => (
                            <Link
                                key={show.id}
                                href={`/cooking/${show.id}`}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                            >
                                {/* Square Poster */}
                                <div className="aspect-square bg-gray-200 relative">
                                    <img src={show.poster} alt={show.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {show.episodes} قسمت
                                    </div>
                                    {show.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                                            <div className="h-full bg-orange-500" style={{ width: `${show.progress}%` }} />
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
                                        <span className="text-xs text-gray-500">{show.year}</span>
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
