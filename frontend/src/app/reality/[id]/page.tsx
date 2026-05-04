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
const mockRealityShows: Record<number, SeriesData> = {
    1101: {
        id: 1101,
        title: "Keep Running / 奔跑吧",
        description: "بدو بدو - ریالیتی شوی محبوب چینی بر اساس برنامه کره‌ای Running Man.",
        synopsis: "«بدو بدو» (奔跑吧) یکی از پربیننده‌ترین ریالیتی شوهای چین است. در هر قسمت، گروهی از بازیگران و خوانندگان مشهور چینی در بازی‌ها و چالش‌های مختلف شرکت می‌کنند. این برنامه فرصت عالی‌ای برای یادگیری چینی محاوره‌ای است، زیرا شرکت‌کنندگان با زبان طبیعی و روزمره صحبت می‌کنند. فصل‌های مختلف با بازیگران متنوع پخش شده.",
        genre: "ریالیتی شو، مسابقه، سرگرمی",
        year: 2014,
        cast: ["Angelababy", "Deng Chao (邓超)", "Li Chen (李晨)", "Zheng Kai (郑恺)", "Lu Han (鹿晗)"],
        rating: 4.5,
        episodes_count: 72,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Keep_Running_%28Chinese_TV_series%29.jpg/220px-Keep_Running_%28Chinese_TV_series%29.jpg",
        level: "Intermediate",
        category: "reality",
        sections: [{
            id: 1,
            title: "قسمت‌های منتخب",
            lessons: [
                { id: 11101, title: "S1E1: The First Mission", duration_minutes: 90, is_free: true },
                { id: 11102, title: "S1E2: Name Tag Battle", duration_minutes: 85, is_free: true },
                { id: 11103, title: "S1E3: Watermelon Challenge", duration_minutes: 88, is_free: false },
                { id: 11104, title: "S1E4: Night Running", duration_minutes: 92, is_free: false },
                { id: 11105, title: "S1E5: Celebrity Special", duration_minutes: 95, is_free: false },
            ]
        }]
    },
    1102: {
        id: 1102,
        title: "Go Fighting! / 极限挑战",
        description: "چالش نهایی - ریالیتی شوی محبوب با بازیگران کمدی چین.",
        synopsis: "«چالش نهایی» (极限挑战) یکی از خلاقانه‌ترین ریالیتی شوهای چین است. شش بازیگر و کمدین مشهور در هر قسمت با چالش‌های ذهنی و فیزیکی مختلف روبرو می‌شوند. بر خلاف بسیاری از ریالیتی شوها، این برنامه بیشتر بر هوش و استراتژی تمرکز دارد تا قدرت بدنی. مکالمات طبیعی و پر از شوخی‌های چینی، آن را منبعی عالی برای یادگیری عبارات روزمره و فرهنگ عامه چین کرده.",
        genre: "ریالیتی شو، کمدی، استراتژی",
        year: 2015,
        cast: ["Huang Bo (黄渤)", "Huang Lei (黄磊)", "Sun Honglei (孙红雷)", "Zhang Yixing (张艺兴)", "Wang Xun (王迅)", "Luo Zhixiang (罗志祥)"],
        rating: 4.6,
        episodes_count: 60,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/0/06/Go_Fighting%21_Season_1.jpg/220px-Go_Fighting%21_Season_1.jpg",
        level: "Intermediate - Advanced",
        category: "reality",
        sections: [{
            id: 1,
            title: "قسمت‌های منتخب",
            lessons: [
                { id: 11201, title: "S1E1: Time Travel Challenge", duration_minutes: 88, is_free: true },
                { id: 11202, title: "S1E2: Undercover Mission", duration_minutes: 90, is_free: true },
                { id: 11203, title: "S1E3: Market Survival", duration_minutes: 85, is_free: false },
                { id: 11204, title: "S1E4: Detective Game", duration_minutes: 92, is_free: false },
            ]
        }]
    },
    1103: {
        id: 1103,
        title: "Day Day Up / 天天向上",
        description: "هر روز بهتر - تاک‌شو و ریالیتی فرهنگی با محوریت معرفی فرهنگ چینی.",
        synopsis: "«هر روز رو به بالا» (天天向上) یکی از طولانی‌ترین و محبوب‌ترین برنامه‌های تلویزیون هونان است. این برنامه ترکیبی از تاک‌شو، مسابقه و معرفی فرهنگ است. هر قسمت به یک موضوع فرهنگی مانند غذاهای محلی، هنرهای سنتی یا سبک زندگی می‌پردازد. مجریان با دعوت از مهمانان مختلف، فرهنگ و آداب و رسوم مناطق مختلف چین را معرفی می‌کنند.",
        genre: "تاک‌شو، فرهنگی، سرگرمی",
        year: 2008,
        cast: ["Wang Han (汪涵)", "Qian Feng (钱枫)", "Da Zhang Wei (大张伟)", "Wang Yibo (王一博)"],
        rating: 4.4,
        episodes_count: 200,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Day_Day_Up.jpg/220px-Day_Day_Up.jpg",
        level: "All Levels",
        category: "reality",
        sections: [{
            id: 1,
            title: "قسمت‌های منتخب",
            lessons: [
                { id: 11301, title: "Chinese Food Culture Special", duration_minutes: 75, is_free: true },
                { id: 11302, title: "Traditional Arts & Crafts", duration_minutes: 70, is_free: true },
                { id: 11303, title: "Chinese Fashion Evolution", duration_minutes: 72, is_free: false },
                { id: 11304, title: "Regional Dialects Challenge", duration_minutes: 68, is_free: false },
                { id: 11305, title: "Chinese Music History", duration_minutes: 73, is_free: false },
            ]
        }]
    }
};

export default function RealityDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [show, setShow] = useState<SeriesData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShow = async () => {
            if (courseId && mockRealityShows[courseId]) {
                setShow(mockRealityShows[courseId]);
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/courses/${id}`);
                setShow(response.data);
            } catch (error) {
                if (courseId && mockRealityShows[courseId]) {
                    setShow(mockRealityShows[courseId]);
                } else if (!isHttpStatus(error, 404)) {
                    console.error("Failed to fetch reality show:", error);
                }
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchShow();
    }, [id, courseId]);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!show) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">برنامه یافت نشد</div>
            </div>
        );
    }

    const allParts = show.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/reality" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <button className="text-gray-600"><Bookmark size={22} /></button>
                    <button className="text-gray-600"><MoreVertical size={22} /></button>
                </div>
            </header>

            <main className="px-6 py-4">
                {/* Show Header */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="text-xs text-pink-600 font-bold mb-1 uppercase tracking-wide">
                            Chinese Reality Show
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{show.title}</h1>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="text-orange-400 fill-orange-400" />
                                <span className="text-sm font-bold text-gray-800">{show.rating || 4.5}</span>
                            </div>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{show.year}</span>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{show.episodes_count} قسمت</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {show.genre?.split('،').map((g, i) => (
                                <span key={i} className="text-[10px] bg-pink-50 text-pink-600 px-2 py-1 rounded-full">
                                    {g.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="w-28 flex-shrink-0">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-gray-200">
                            <img src={show.cover_image_url} alt={show.title} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                {/* Show Info */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">خلاصه برنامه</h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify mb-4">
                        {show.synopsis || show.description}
                    </p>

                    {show.cast && show.cast.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">اعضا / شرکت‌کنندگان</h3>
                            <div className="flex flex-wrap gap-2">
                                {show.cast.map((member, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-full pr-1 pl-3 py-1 border border-gray-100">
                                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-[10px] text-pink-600 font-bold">
                                            {member[0]}
                                        </div>
                                        <span className="text-xs text-gray-700">{member}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-2">سال</h3>
                        <div className="bg-pink-50 rounded-xl px-3 py-2 border border-pink-100 w-fit">
                            <span className="text-sm text-pink-700 font-medium">{show.year}</span>
                        </div>
                    </div>
                </div>

                {/* Episodes List */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Play size={20} className="text-pink-600" />
                        فهرست قسمت‌ها
                    </h3>
                    <div className="space-y-3">
                        {allParts.map((lesson, index) => (
                            <Link
                                key={lesson.id}
                                href={`/watch/reality/${show.id}?lesson=${lesson.id}`}
                                className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-transform"
                            >
                                <div className="flex">
                                    <div className="w-28 h-20 bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                        <img src={getVideoThumbnail(lesson.id)} alt={lesson.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                <Play size={14} className="text-pink-600 fill-pink-600 ml-0.5" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded">
                                            {lesson.duration_minutes} min
                                        </div>
                                    </div>
                                    <div className="flex-1 p-2.5 flex flex-col justify-center min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-gray-400 font-medium">قسمت {index + 1}</span>
                                            {lesson.is_free && <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">رایگان</span>}
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-1 truncate" dir="ltr">{lesson.title}</h4>
                                        <p className="text-[10px] text-gray-500 line-clamp-1">{show.title}</p>
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
