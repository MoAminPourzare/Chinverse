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
const mockMovies: Record<number, SeriesData> = {
    401: {
        id: 401,
        title: "Dying to Survive / 我不是药神",
        description: "من خدای دارو نیستم - داستان واقعی یک فروشنده دارو که به قهرمان مردم تبدیل می‌شود.",
        synopsis: "چنگ یونگ (شو ژنگ) صاحب یک مغازه کوچک است که زندگی معمولی‌ای دارد. روزی با گروهی از بیماران سرطانی آشنا می‌شود که توانایی خرید داروهای گران‌قیمت را ندارند. او شروع به قاچاق داروی ارزان هندی به چین می‌کند و به تدریج از یک تاجر خودخواه به یک قهرمان واقعی تبدیل می‌شود. این فیلم بر اساس داستان واقعی ساخته شده و تأثیر عمیقی بر سیاست‌های دارویی چین گذاشت.",
        genre: "درام، کمدی درام",
        year: 2018,
        cast: ["Xu Zheng", "Wang Chuanjun", "Zhou Yiwei", "Tan Zhuo"],
        rating: 4.9,
        episodes_count: 1,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Dying_to_Survive_poster.jpg/220px-Dying_to_Survive_poster.jpg",
        level: "Intermediate",
        category: "movies",
        sections: [{
            id: 1,
            title: "فیلم کامل",
            lessons: [
                { id: 10001, title: "Part 1: The Beginning", duration_minutes: 40, is_free: true },
                { id: 10002, title: "Part 2: The Smuggling", duration_minutes: 35, is_free: false },
                { id: 10003, title: "Part 3: The Transformation", duration_minutes: 42, is_free: false },
            ]
        }]
    },
    402: {
        id: 402,
        title: "The Wandering Earth / 流浪地球",
        description: "زمین سرگردان - بشریت باید زمین را از منظومه شمسی خارج کند تا از نابودی نجات یابد.",
        synopsis: "در آینده‌ای نزدیک، خورشید در حال مرگ است و زمین در خطر نابودی قرار دارد. دولت‌های جهان متحد شده و طرح عظیمی به نام «زمین سرگردان» را اجرا می‌کنند: نصب هزاران موتور غول‌پیکر بر سطح زمین برای حرکت دادن سیاره به سمت یک ستاره جدید. لیو چی (وو جینگ) فضانورد و پسرش لیو هان‌چیانگ (چو چوشیائو) باید با هم برای نجات بشریت بجنگند.",
        genre: "علمی تخیلی، اکشن، درام",
        year: 2019,
        cast: ["Wu Jing", "Qu Chuxiao", "Li Guangjie", "Ng Man-tat"],
        rating: 4.5,
        episodes_count: 1,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/The_Wandering_Earth_poster.png/220px-The_Wandering_Earth_poster.png",
        level: "Advanced",
        category: "movies",
        sections: [{
            id: 1,
            title: "فیلم کامل",
            lessons: [
                { id: 10004, title: "Part 1: Earth's Crisis", duration_minutes: 45, is_free: true },
                { id: 10005, title: "Part 2: The Mission", duration_minutes: 40, is_free: false },
                { id: 10006, title: "Part 3: The Final Push", duration_minutes: 38, is_free: false },
            ]
        }]
    },
    403: {
        id: 403,
        title: "Better Days / 少年的你",
        description: "روزهای بهتر - داستان دو نوجوان که در برابر قلدری و فشارهای اجتماعی از هم محافظت می‌کنند.",
        synopsis: "چن نیان (ژو دونگ‌یو) دانش‌آموز ممتاز دبیرستانی است که هدفش ورود به دانشگاه معتبر است. پس از خودکشی یکی از همکلاسی‌هایش به دلیل قلدری، او نیز هدف آزار و اذیت قرار می‌گیرد. در این میان با شیائو بی (یی یانگ چیان‌شی)، پسر خیابانی، آشنا می‌شود و آنها قول می‌دهند از هم محافظت کنند. این فیلم نگاهی عمیق به مسائل قلدری، فشار تحصیلی، و بلوغ در جامعه چین دارد.",
        genre: "درام، جنایی، عاشقانه",
        year: 2019,
        cast: ["Zhou Dongyu", "Jackson Yee", "Yin Fang"],
        rating: 4.8,
        episodes_count: 1,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/7/74/Better_Days_film_poster.png/220px-Better_Days_film_poster.png",
        level: "Intermediate",
        category: "movies",
        sections: [{
            id: 1,
            title: "فیلم کامل",
            lessons: [
                { id: 10007, title: "Part 1: School Life", duration_minutes: 38, is_free: true },
                { id: 10008, title: "Part 2: The Pact", duration_minutes: 42, is_free: false },
                { id: 10009, title: "Part 3: The Truth", duration_minutes: 35, is_free: false },
            ]
        }]
    }
};

export default function MovieDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [movie, setMovie] = useState<SeriesData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            if (courseId && mockMovies[courseId]) {
                setMovie(mockMovies[courseId]);
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/courses/${id}`);
                setMovie(response.data);
            } catch (error) {
                // Fallback to mock data
                if (courseId && mockMovies[courseId]) {
                    setMovie(mockMovies[courseId]);
                } else if (!isHttpStatus(error, 404)) {
                    console.error("Failed to fetch movie:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMovie();
        }
    }, [id, courseId]);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">فیلم یافت نشد</div>
            </div>
        );
    }

    // Flatten parts
    const allParts = movie.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/movies" className="text-gray-600">
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
                {/* Movie Header */}
                <div className="flex gap-4 mb-6">
                    {/* Metadata (Left in RTL) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs text-red-600 font-bold mb-1 uppercase tracking-wide">
                            Chinese Cinema
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                            {movie.title}
                        </h1>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="text-orange-400 fill-orange-400" />
                                <span className="text-sm font-bold text-gray-800">{movie.rating || 4.5}</span>
                            </div>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{movie.year || 2020}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {movie.genre?.split('،').map((g, i) => (
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
                                src={movie.cover_image_url}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Movie Info */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">خلاصه داستان</h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify mb-4">
                        {movie.synopsis || movie.description}
                    </p>

                    {movie.cast && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">بازیگران</h3>
                            <div className="flex flex-wrap gap-2">
                                {movie.cast.map((actor, i) => (
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

                {/* Parts List */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Play size={20} className="text-red-600" />
                        فهرست بخش‌ها
                    </h3>
                    <div className="space-y-3">
                        {allParts.map((lesson, index) => (
                            <Link
                                key={lesson.id}
                                href={`/watch/movies/${movie.id}?lesson=${lesson.id}`}
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
                                                <Play size={14} className="text-red-600 fill-red-600 ml-0.5" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded">
                                            {lesson.duration_minutes}:00
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-2.5 flex flex-col justify-center min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-gray-400 font-medium">بخش {index + 1}</span>
                                            {lesson.is_free && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">رایگان</span>}
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-1 truncate" dir="ltr">
                                            {lesson.title}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 line-clamp-1">
                                            {movie.title}
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
