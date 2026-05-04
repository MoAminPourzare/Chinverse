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

// Mock podcasts
const mockPodcasts = [
    {
        id: 1001,
        title: "ChinesePod",
        episodes: 50,
        rating: 4.8,
        year: 2005,
        poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Podcast_microphone.jpg/220px-Podcast_microphone.jpg",
        progress: 0,
    },
    {
        id: 1002,
        title: "Mandarin Bean",
        episodes: 30,
        rating: 4.6,
        year: 2018,
        poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/220px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
        progress: 0,
    },
    {
        id: 1003,
        title: "Slow Chinese / 慢速中文",
        episodes: 45,
        rating: 4.7,
        year: 2010,
        poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/220px-Camponotus_flavomarginatus_ant.jpg",
        progress: 0,
    },
];

export default function PodcastsExplorePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=podcasts`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch podcasts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const displayPodcasts = mockPodcasts;

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">پادکست</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {displayPodcasts.map((podcast) => (
                            <Link
                                key={podcast.id}
                                href={`/podcasts/${podcast.id}`}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                            >
                                {/* Square Cover */}
                                <div className="aspect-square bg-gray-200 relative">
                                    <img src={podcast.poster} alt={podcast.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {podcast.episodes} اپیزود
                                    </div>
                                    {/* Audio Icon Badge */}
                                    <div className="absolute bottom-2 left-2 bg-white/90 rounded-full w-7 h-7 flex items-center justify-center shadow">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                                            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                                            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
                                            {podcast.title}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Star size={12} className="text-orange-400 fill-orange-400" />
                                        <span className="text-xs text-gray-600">{podcast.rating}</span>
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
