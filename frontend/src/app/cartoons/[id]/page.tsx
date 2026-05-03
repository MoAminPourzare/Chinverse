"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Bookmark, MoreVertical, Play } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { SeriesData } from "@/lib/types";
import { getVideoThumbnail } from "@/lib/videoUtils";

// Extended type for cartoons with director
interface CartoonData extends SeriesData {
    director?: string;
}

// ==================== MOCK DATA ====================
const mockCartoons: Record<number, CartoonData> = {
    501: {
        id: 501,
        title: "Ne Zha / 哪吒之魔童降世",
        description: "نژا - داستان پسر شیطان‌زاده‌ای که سرنوشت خود را به چالش می‌کشد.",
        synopsis: "نژا، فرزند ژنرال لی جینگ، از یک گوی شیطانی متولد می‌شود و مقدر است تا سه سالگی بمیرد. مردم از او می‌ترسند و او را طرد می‌کنند. اما نژا تصمیم می‌گیرد سرنوشت خود را نپذیرد و ثابت کند که می‌تواند قهرمان باشد، نه شیطان. این انیمیشن پرفروش‌ترین فیلم انیمیشن تاریخ چین است و داستانی الهام‌بخش درباره مقاومت در برابر تقدیر ارائه می‌دهد.",
        genre: "انیمیشن، فانتزی، اکشن، کمدی",
        year: 2019,
        director: "Yu Yang (饺子)",
        cast: ["Lü Yanting", "Joseph Han", "Chen Hao", "Lü Qi"],
        rating: 4.8,
        episodes_count: 1,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/Ne_Zha_%282019_film%29_poster.png/220px-Ne_Zha_%282019_film%29_poster.png",
        level: "Beginner",
        category: "cartoons",
        sections: [{
            id: 1,
            title: "انیمیشن کامل",
            lessons: [
                { id: 11001, title: "Part 1: Birth of Ne Zha", duration_minutes: 35, is_free: true },
                { id: 11002, title: "Part 2: Training & Mischief", duration_minutes: 30, is_free: false },
                { id: 11003, title: "Part 3: The Final Battle", duration_minutes: 40, is_free: false },
            ]
        }]
    },
    502: {
        id: 502,
        title: "White Snake / 白蛇：缘起",
        description: "مار سفید - داستان عاشقانه یک روح مار و یک شکارچی مار در چین باستان.",
        synopsis: "در دوره تانگ، بلانکا (مار سفید) مأمور ترور یک ژنرال تاریکی می‌شود اما حافظه‌اش را از دست می‌دهد. شوان، یک شکارچی مار ساده‌دل، او را نجات می‌دهد و آنها عاشق هم می‌شوند. اما دنیای انسان‌ها و ارواح نمی‌تواند عشق آنها را بپذیرد. این انیمیشن بازآفرینی زیبای افسانه معروف چینی «مار سفید» است.",
        genre: "انیمیشن، فانتزی، عاشقانه",
        year: 2019,
        director: "Amp Wong, Ji Zhao",
        cast: ["Zhang Zhe", "Yang Tianxiang", "Tang Xiaoxi"],
        rating: 4.6,
        episodes_count: 1,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/de/White_Snake_%28film%29_poster.jpg/220px-White_Snake_%28film%29_poster.jpg",
        level: "Intermediate",
        category: "cartoons",
        sections: [{
            id: 1,
            title: "انیمیشن کامل",
            lessons: [
                { id: 11004, title: "Part 1: The Lost Memory", duration_minutes: 32, is_free: true },
                { id: 11005, title: "Part 2: Love & Danger", duration_minutes: 35, is_free: false },
                { id: 11006, title: "Part 3: The Sacrifice", duration_minutes: 30, is_free: false },
            ]
        }]
    },
    503: {
        id: 503,
        title: "Big Fish & Begonia / 大鱼海棠",
        description: "ماهی بزرگ و بگونیا - داستان دختری از دنیای دیگر که انسانی را به شکل ماهی زنده می‌کند.",
        synopsis: "چون، دختری از دنیایی فراتر از آسمان، در شانزده سالگی به دنیای انسان‌ها سفر می‌کند. وقتی یک پسر برای نجات او جان می‌بازد، چون تصمیم می‌گیرد روح او را به شکل یک ماهی کوچک زنده کند. او باید ماهی را بزرگ کند و به دریا بازگرداند، حتی اگر به قیمت جانش تمام شود. این انیمیشن شاعرانه با الهام از اسطوره‌های چینی ساخته شده است.",
        genre: "انیمیشن، فانتزی، درام",
        year: 2016,
        director: "Liang Xuan, Zhang Chun",
        cast: ["Ji Guanlin", "Su Shangqing", "Xu Wei"],
        rating: 4.5,
        episodes_count: 1,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Big_Fish_%26_Begonia_poster.jpg/220px-Big_Fish_%26_Begonia_poster.jpg",
        level: "Intermediate",
        category: "cartoons",
        sections: [{
            id: 1,
            title: "انیمیشن کامل",
            lessons: [
                { id: 11007, title: "Part 1: The Journey", duration_minutes: 38, is_free: true },
                { id: 11008, title: "Part 2: The Fish", duration_minutes: 35, is_free: false },
                { id: 11009, title: "Part 3: The Return", duration_minutes: 32, is_free: false },
            ]
        }]
    }
};

export default function CartoonDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [cartoon, setCartoon] = useState<CartoonData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCartoon = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCartoon(response.data);
            } catch (error) {
                console.error("Failed to fetch cartoon:", error);
                // Fallback to mock data
                if (courseId && mockCartoons[courseId]) {
                    setCartoon(mockCartoons[courseId]);
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCartoon();
        }
    }, [id, courseId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!cartoon) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">انیمیشن یافت نشد</div>
            </div>
        );
    }

    // Flatten parts
    const allParts = cartoon.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/cartoons" className="text-gray-600">
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
                {/* Cartoon Header */}
                <div className="flex gap-4 mb-6">
                    {/* Metadata (Left in RTL) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs text-purple-600 font-bold mb-1 uppercase tracking-wide">
                            Chinese Animation
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                            {cartoon.title}
                        </h1>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="text-orange-400 fill-orange-400" />
                                <span className="text-sm font-bold text-gray-800">{cartoon.rating || 4.5}</span>
                            </div>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{cartoon.year || 2019}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {cartoon.genre?.split('،').map((g, i) => (
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
                                src={cartoon.cover_image_url}
                                alt={cartoon.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Cartoon Info */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">خلاصه داستان</h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify mb-4">
                        {cartoon.synopsis || cartoon.description}
                    </p>

                    {cartoon.director && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">کارگردان</h3>
                            <div className="flex items-center gap-2 bg-gray-50 rounded-full pr-1 pl-3 py-1 border border-gray-100 w-fit">
                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] text-purple-600 font-bold">
                                    {cartoon.director[0]}
                                </div>
                                <span className="text-xs text-gray-700">{cartoon.director}</span>
                            </div>
                        </div>
                    )}

                    {cartoon.cast && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">صداپیشگان</h3>
                            <div className="flex flex-wrap gap-2">
                                {cartoon.cast.map((actor, i) => (
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
                        <Play size={20} className="text-purple-600" />
                        فهرست بخش‌ها
                    </h3>
                    <div className="space-y-3">
                        {allParts.map((lesson, index) => (
                            <Link
                                key={lesson.id}
                                href={`/watch/cartoons/${cartoon.id}?lesson=${lesson.id}`}
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
                                                <Play size={14} className="text-purple-600 fill-purple-600 ml-0.5" />
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
                                            {cartoon.title}
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
