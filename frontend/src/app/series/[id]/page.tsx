"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Bookmark, MoreVertical, Play } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { SeriesData } from "@/lib/types";
import { getVideoThumbnail } from "@/lib/videoUtils";
import { isHttpStatus } from "@/lib/http";

// ==================== MOCK DATA ====================
const mockSeriesCourses: Record<number, SeriesData> = {
    301: {
        id: 301,
        title: "Reset / 开端",
        description: "وقتی یک دانشجوی کالج و یک طراح بازی ویدیویی در یک حلقه زمانی در اتوبوس گرفتار می‌شوند...",
        synopsis: "لی شین کینگ (ژائو جین مای) دانشجوی کالج و شیائو هی یون (بای جینگ تینگ) طراح بازی ویدیویی در یک حلقه زمانی در اتوبوس گرفتار می‌شوند. آنها باید راهی برای جلوگیری از انفجار اتوبوس و نجات جان مسافران پیدا کنند. این سریال معمایی و هیجان‌انگیز، داستانی از تلاش برای بقا و کشف حقیقت است.",
        genre: "علمی تخیلی، معمایی، هیجان‌انگیز",
        year: 2022,
        cast: ["Zhao Jinmai", "Bai Jingting", "Liu Yijun"],
        rating: 4.8,
        episodes_count: 15,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Reset_2022_Poster.jpg/220px-Reset_2022_Poster.jpg",
        level: "Intermediate",
        category: "series",
        sections: [{
            id: 1,
            title: "Episodes",
            lessons: [
                { id: 7001, title: "Episode 1: The Beginning", duration_minutes: 45, is_free: true },
                { id: 7002, title: "Episode 2: The Loop", duration_minutes: 42, is_free: true },
                { id: 7003, title: "Episode 3: Investigation", duration_minutes: 44, is_free: false },
                { id: 7004, title: "Episode 4: Suspects", duration_minutes: 43, is_free: false },
                { id: 7005, title: "Episode 5: The Driver", duration_minutes: 46, is_free: false },
            ]
        }]
    },
    302: {
        id: 302,
        title: "The Untamed / 陈情令",
        description: "داستانی حماسی از دو همدم که برای حل مجموعه‌ای از معماها و برقراری عدالت با هم متحد می‌شوند.",
        synopsis: "وی ووشیان (شیائو ژان) و لان وانگ‌جی (وانگ ییبو) دو شاگرد با استعداد از قبیله‌های معتبر هستند که در طی آموزش با هم آشنا می‌شوند. سال‌ها بعد، وی ووشیان که گمان می‌رفت کشته شده، بازمی‌گردد و با لان وانگ‌جی متحد می‌شود تا حقیقت پشت رویدادهای گذشته را کشف کند.",
        genre: "فانتزی، تاریخی، ماجراجویی",
        year: 2019,
        cast: ["Xiao Zhan", "Wang Yibo"],
        rating: 4.9,
        episodes_count: 50,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/5/52/The_Untamed_web_series_poster.jpg/220px-The_Untamed_web_series_poster.jpg",
        level: "Advanced",
        category: "series",
        sections: [{
            id: 1,
            title: "Episodes",
            lessons: [
                { id: 8001, title: "Episode 1", duration_minutes: 50, is_free: true },
                { id: 8002, title: "Episode 2", duration_minutes: 48, is_free: true },
                { id: 8003, title: "Episode 3", duration_minutes: 49, is_free: false },
            ]
        }]
    },
    303: {
        id: 303,
        title: "Go Ahead / 以家人之名",
        description: "داستان سه کودک بدون ارتباط خونی که خانواده‌ای را تشکیل می‌دهند و با هم بزرگ می‌شوند.",
        synopsis: "سه کودک که هر کدام مشکلات خانوادگی خود را دارند، تصمیم می‌گیرند مانند یک خانواده واقعی با هم زندگی کنند. آنها از یکدیگر حمایت می‌کنند تا زخم‌های گذشته را التیام بخشند. این سریال داستانی گرم و صمیمی درباره عشق، خانواده و رشد است.",
        genre: "درام، عاشقانه، خانوادگی",
        year: 2020,
        cast: ["Tan Songyun", "Song Weilong", "Zhang Xincheng"],
        rating: 4.7,
        episodes_count: 40,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Go_Ahead_TV_series_poster.jpg/220px-Go_Ahead_TV_series_poster.jpg",
        level: "Intermediate",
        category: "series",
        sections: [{
            id: 1,
            title: "Episodes",
            lessons: [
                { id: 9001, title: "Episode 1", duration_minutes: 45, is_free: true },
                { id: 9002, title: "Episode 2", duration_minutes: 45, is_free: true },
            ]
        }]
    }
};

export default function SeriesDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [series, setSeries] = useState<SeriesData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeries = async () => {
            if (courseId && mockSeriesCourses[courseId]) {
                setSeries(mockSeriesCourses[courseId]);
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/courses/${id}`);
                setSeries(response.data);
            } catch (error) {
                // Fallback to mock data
                if (courseId && mockSeriesCourses[courseId]) {
                    setSeries(mockSeriesCourses[courseId]);
                } else if (!isHttpStatus(error, 404)) {
                    console.error("Failed to fetch series:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSeries();
        }
    }, [id, courseId]);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!series) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">سریال یافت نشد</div>
            </div>
        );
    }

    // Flatten episodes
    const allEpisodes = series.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/series" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <button className="text-gray-600">
                        <Bookmark size={22} />
                    </button>
                    <button className="text-gray-600">
                        <MoreVertical size={22} />
                    </button>
                </div>
            </header>

            <main className="px-6 py-4">
                {/* Series Header */}
                <div className="flex gap-4 mb-6">
                    {/* Metadata (Left in RTL) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wide">
                            Chinese Entertainment
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                            {series.title}
                        </h1>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="text-orange-400 fill-orange-400" />
                                <span className="text-sm font-bold text-gray-800">{series.rating || 4.5}</span>
                            </div>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{series.year || 2022}</span>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{series.episodes_count || 20} قسمت</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {series.genre?.split('،').map((g, i) => (
                                <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    {g.trim()}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Poster (Right in RTL) */}
                    <div className="w-28 flex-shrink-0">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-gray-200">
                            <img
                                src={series.cover_image_url}
                                alt={series.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Series Info */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">خلاصه داستان</h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify mb-4">
                        {series.synopsis || series.description}
                    </p>

                    {series.cast && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">بازیگران</h3>
                            <div className="flex flex-wrap gap-2">
                                {series.cast.map((actor, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-full pr-1 pl-3 py-1 border border-gray-100">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                                            {actor[0]}
                                        </div>
                                        <span className="text-xs text-gray-700">{actor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Episodes List */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Play size={20} className="text-blue-600" />
                        فهرست قسمت‌ها
                    </h3>
                    <div className="space-y-3">
                        {allEpisodes.map((lesson, index) => (
                            <Link
                                key={lesson.id}
                                href={`/watch/series/${series.id}?lesson=${lesson.id}`}
                                className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-transform"
                            >
                                <div className="flex">
                                    {/* Thumbnail */}
                                    <div className="w-28 h-20 bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                        <img
                                            src={getVideoThumbnail(lesson.id)}
                                            alt={lesson.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                <Play size={14} className="text-blue-600 fill-blue-600 ml-0.5" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded">
                                            {lesson.duration_minutes}:00
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-2.5 flex flex-col justify-center min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-gray-400 font-medium">قسمت {index + 1}</span>
                                            {lesson.is_free && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">رایگان</span>}
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-1 truncate" dir="ltr">
                                            {lesson.title}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 line-clamp-1">
                                            {series.title} - Episode {index + 1}
                                        </p>
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
