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

// Mock music artists data
const mockArtists = [
    {
        id: 601,
        title: "Jay Chou / 周杰伦",
        tracks: 12,
        rating: 4.9,
        year: 2000,
        poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Jay_Chou_2019.jpg/220px-Jay_Chou_2019.jpg",
        progress: 0,
    },
    {
        id: 602,
        title: "G.E.M. / 邓紫棋",
        tracks: 10,
        rating: 4.7,
        year: 2012,
        poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/G.E.M._at_Madame_Tussauds_Hong_Kong.jpg/220px-G.E.M._at_Madame_Tussauds_Hong_Kong.jpg",
        progress: 0,
    },
    {
        id: 603,
        title: "Eason Chan / 陈奕迅",
        tracks: 15,
        rating: 4.8,
        year: 1996,
        poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Eason_Chan_2009.jpg/220px-Eason_Chan_2009.jpg",
        progress: 0,
    },
];

export default function MusicExplorePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=music`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch music:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const displayArtists = mockArtists;

    return (
        <div className="min-h-full bg-gray-50 pb-20" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">موسیقی</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displayArtists.map((artist) => (
                            <Link
                                key={artist.id}
                                href={`/music/${artist.id}`}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                            >
                                {/* Square Artist Photo */}
                                <div className="aspect-square bg-gray-200 relative">
                                    <img
                                        src={artist.poster}
                                        alt={artist.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

                                    {/* Track Count Badge */}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {artist.tracks} آهنگ
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                                            {artist.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-1 mt-2">
                                        <Star size={12} className="text-orange-400 fill-orange-400" />
                                        <span className="text-xs text-gray-600">{artist.rating}</span>
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
