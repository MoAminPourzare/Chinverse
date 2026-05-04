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

// Mock movies data
const mockMovies = [
    {
        id: 401,
        title: "Dying to Survive / 我不是药神",
        episodes: 1,
        rating: 4.9,
        year: 2018,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Dying_to_Survive_poster.jpg/220px-Dying_to_Survive_poster.jpg",
        progress: 0,
    },
    {
        id: 402,
        title: "The Wandering Earth / 流浪地球",
        episodes: 1,
        rating: 4.5,
        year: 2019,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/The_Wandering_Earth_poster.png/220px-The_Wandering_Earth_poster.png",
        progress: 0,
    },
    {
        id: 403,
        title: "Better Days / 少年的你",
        episodes: 1,
        rating: 4.8,
        year: 2019,
        poster: "https://upload.wikimedia.org/wikipedia/en/thumb/7/74/Better_Days_film_poster.png/220px-Better_Days_film_poster.png",
        progress: 0,
    },
];

export default function MoviesExplorePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=movies`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch movies:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const displayMovies = mockMovies;

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">فیلم</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displayMovies.map((movie) => (
                            <Link
                                key={movie.id}
                                href={`/movies/${movie.id}`}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                            >
                                {/* Portrait Poster */}
                                <div className="aspect-[2/3] bg-gray-200 relative">
                                    <img
                                        src={movie.poster}
                                        alt={movie.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

                                    {/* Year Badge */}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {movie.year}
                                    </div>

                                    {/* Progress Bar (if started) */}
                                    {movie.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                                            <div
                                                className="h-full bg-red-500"
                                                style={{ width: `${movie.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                                            {movie.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-1 mt-2">
                                        <Star size={12} className="text-orange-400 fill-orange-400" />
                                        <span className="text-xs text-gray-600">{movie.rating}</span>
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
