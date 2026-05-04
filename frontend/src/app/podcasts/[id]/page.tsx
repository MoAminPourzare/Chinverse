"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Bookmark, MoreVertical, Play, Headphones } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { SeriesData } from "@/lib/types";
import { isHttpStatus } from "@/lib/http";

// Extended type for podcasts
interface PodcastData extends SeriesData {
    host?: string;
    frequency?: string;
}

// ==================== MOCK DATA ====================
const mockPodcasts: Record<number, PodcastData> = {
    1001: {
        id: 1001,
        title: "ChinesePod",
        description: "چاینیزپاد - یکی از قدیمی‌ترین و معتبرترین پادکست‌های آموزش زبان چینی.",
        synopsis: "ChinesePod از سال ۲۰۰۵ فعالیت خود را آغاز کرده و یکی از جامع‌ترین منابع صوتی برای یادگیری زبان چینی است. هر اپیزود شامل مکالمه‌ای طبیعی به زبان چینی، توضیحات گرامری، واژگان کلیدی و تمرین‌های شنیداری است. سطوح مختلف از مبتدی تا پیشرفته پوشش داده می‌شود.",
        genre: "آموزشی، مکالمه، گرامر",
        year: 2005,
        host: "Ken Carroll & Jenny Zhu",
        cast: ["Ken Carroll", "Jenny Zhu"],
        rating: 4.8,
        episodes_count: 50,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Podcast_microphone.jpg/220px-Podcast_microphone.jpg",
        level: "All Levels",
        category: "podcasts",
        sections: [{
            id: 1,
            title: "اپیزودهای منتخب",
            lessons: [
                { id: 10001, title: "Ordering Food at a Restaurant", duration_minutes: 18, is_free: true },
                { id: 10002, title: "Taking a Taxi in Beijing", duration_minutes: 15, is_free: true },
                { id: 10003, title: "Talking About the Weather", duration_minutes: 12, is_free: false },
                { id: 10004, title: "Making Plans with Friends", duration_minutes: 16, is_free: false },
                { id: 10005, title: "Shopping at a Market", duration_minutes: 14, is_free: false },
                { id: 10006, title: "Visiting the Doctor", duration_minutes: 20, is_free: false },
            ]
        }]
    },
    1002: {
        id: 1002,
        title: "Mandarin Bean",
        description: "ماندارین بین - پادکست مکالمه‌های واقعی چینی با ترجمه و توضیح.",
        synopsis: "Mandarin Bean پادکستی جدیدتر است که بر مکالمه‌های واقعی و طبیعی تمرکز دارد. هر اپیزود شامل یک مکالمه کوتاه بین دو چینی‌زبان است که با سرعت طبیعی صحبت می‌کنند. سپس مکالمه خط به خط ترجمه و توضیح داده می‌شود. مناسب برای سطح متوسط تا پیشرفته.",
        genre: "مکالمه، شنیداری، واژگان",
        year: 2018,
        host: "Mandarin Bean Team",
        cast: ["Native Chinese Speakers"],
        rating: 4.6,
        episodes_count: 30,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/220px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
        level: "Intermediate",
        category: "podcasts",
        sections: [{
            id: 1,
            title: "اپیزودهای منتخب",
            lessons: [
                { id: 10101, title: "Chatting About Hobbies", duration_minutes: 10, is_free: true },
                { id: 10102, title: "Weekend Plans Conversation", duration_minutes: 12, is_free: true },
                { id: 10103, title: "Discussing a TV Show", duration_minutes: 14, is_free: false },
                { id: 10104, title: "Office Small Talk", duration_minutes: 11, is_free: false },
                { id: 10105, title: "Travel Stories", duration_minutes: 16, is_free: false },
            ]
        }]
    },
    1003: {
        id: 1003,
        title: "Slow Chinese / 慢速中文",
        description: "چینی آهسته - پادکست چینی با سرعت آهسته برای یادگیرندگان.",
        synopsis: "Slow Chinese (慢速中文) پادکستی است که مقالات فرهنگی، تاریخی و اجتماعی چین را با سرعت آهسته و واضح قرائت می‌کند. هر اپیزود ۵ تا ۱۰ دقیقه طول دارد و متن کامل به زبان چینی در وب‌سایت موجود است. عالی برای تقویت مهارت شنیداری و یادگیری واژگان در متن.",
        genre: "فرهنگی، تاریخی، شنیداری",
        year: 2010,
        host: "Slow Chinese Team",
        cast: [],
        rating: 4.7,
        episodes_count: 45,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/220px-Camponotus_flavomarginatus_ant.jpg",
        level: "Intermediate - Advanced",
        category: "podcasts",
        sections: [{
            id: 1,
            title: "اپیزودهای منتخب",
            lessons: [
                { id: 10201, title: "中国的春节 (Chinese New Year)", duration_minutes: 8, is_free: true },
                { id: 10202, title: "中国的茶文化 (Tea Culture)", duration_minutes: 7, is_free: true },
                { id: 10203, title: "长城的故事 (Story of the Great Wall)", duration_minutes: 9, is_free: false },
                { id: 10204, title: "中国的教育系统 (Education System)", duration_minutes: 10, is_free: false },
                { id: 10205, title: "中国互联网 (Chinese Internet)", duration_minutes: 8, is_free: false },
            ]
        }]
    }
};

export default function PodcastDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [podcast, setPodcast] = useState<PodcastData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPodcast = async () => {
            if (courseId && mockPodcasts[courseId]) {
                setPodcast(mockPodcasts[courseId]);
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/courses/${id}`);
                setPodcast(response.data);
            } catch (error) {
                if (courseId && mockPodcasts[courseId]) {
                    setPodcast(mockPodcasts[courseId]);
                } else if (!isHttpStatus(error, 404)) {
                    console.error("Failed to fetch podcast:", error);
                }
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchPodcast();
    }, [id, courseId]);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!podcast) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">پادکست یافت نشد</div>
            </div>
        );
    }

    const allEpisodes = podcast.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/podcasts" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <button className="text-gray-600"><Bookmark size={22} /></button>
                    <button className="text-gray-600"><MoreVertical size={22} /></button>
                </div>
            </header>

            <main className="px-6 py-4">
                {/* Podcast Header */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs text-indigo-600 font-bold mb-1 uppercase tracking-wide">
                            Chinese Podcast
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{podcast.title}</h1>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="text-orange-400 fill-orange-400" />
                                <span className="text-sm font-bold text-gray-800">{podcast.rating || 4.5}</span>
                            </div>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{podcast.episodes_count} اپیزود</span>
                        </div>
                        {podcast.genre && (
                            <div className="flex flex-wrap gap-2">
                                {podcast.genre.split('،').map((g, i) => (
                                    <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                                        {g.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="w-28 flex-shrink-0">
                        <div className="aspect-square rounded-lg overflow-hidden shadow-md bg-gray-200">
                            <img src={podcast.cover_image_url} alt={podcast.title} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                {/* Podcast Info */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">توضیحات</h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify mb-4">
                        {podcast.synopsis || podcast.description}
                    </p>

                    {podcast.host && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">میزبان</h3>
                            <div className="flex items-center gap-2 bg-gray-50 rounded-full pr-1 pl-3 py-1 border border-gray-100 w-fit">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
                                    {podcast.host[0]}
                                </div>
                                <span className="text-xs text-gray-700">{podcast.host}</span>
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-2">سطح</h3>
                        <div className="bg-indigo-50 rounded-xl px-3 py-2 border border-indigo-100 w-fit">
                            <span className="text-sm text-indigo-700 font-medium">{podcast.level}</span>
                        </div>
                    </div>
                </div>

                {/* Episodes List */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Headphones size={20} className="text-indigo-600" />
                        لیست اپیزودها
                    </h3>
                    <div className="space-y-3">
                        {allEpisodes.map((episode, index) => (
                            <Link
                                key={episode.id}
                                href={`/watch/podcasts/${podcast.id}?lesson=${episode.id}`}
                                className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-transform"
                            >
                                <div className="flex items-center">
                                    {/* Episode Number with Audio Icon */}
                                    <div className="w-14 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center">
                                        <Headphones size={20} className="text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-gray-900 text-sm truncate" dir="ltr">
                                                {episode.title}
                                            </h4>
                                            {episode.is_free && (
                                                <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex-shrink-0 mr-2">
                                                    رایگان
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                            <span>اپیزود {index + 1}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{episode.duration_minutes} دقیقه</span>
                                        </div>
                                    </div>

                                    {/* Play Icon */}
                                    <div className="pr-3 pl-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                            <Play size={14} className="text-indigo-600 fill-indigo-600 ml-0.5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
