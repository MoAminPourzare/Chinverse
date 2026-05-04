"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Bookmark, MoreVertical, Play } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { SeriesData } from "@/lib/types";
import { getVideoThumbnail } from "@/lib/videoUtils";
import { isHttpStatus } from "@/lib/http";

// Extended type for cooking shows
interface CookingData extends SeriesData {
    accent?: string;
    host?: string;
}

// ==================== MOCK DATA ====================
const mockCooking: Record<number, CookingData> = {
    901: {
        id: 901,
        title: "Chef Wang / 美食作家王刚",
        description: "سرآشپز وانگ - محبوب‌ترین آشپز یوتیوبر چینی با بیش از ۲۰ میلیون دنبال‌کننده.",
        synopsis: "وانگ‌گانگ (王刚)، معروف به «سرآشپز وانگ»، یکی از محبوب‌ترین آشپزهای اینترنتی چین است. او از سال ۲۰۱۷ شروع به آموزش آشپزی سیچوانی در یوتیوب و بیلی‌بیلی کرد. ویدیوهایش به خاطر سبک حرفه‌ای، آشپزی واقعی رستورانی و لهجه شیرین سیچوانی‌اش شهرت یافت. هر ویدیو یک غذای اصیل چینی را از صفر تا صد آموزش می‌دهد و زیرنویس چینی دارد.",
        genre: "آشپزی، سیچوانی، رستورانی",
        year: 2017,
        host: "Chef Wang (王刚)",
        accent: "لهجه سیچوانی (四川话) - لهجه جنوب‌غربی، طبیعی و ساده، مناسب تمرین شنیداری",
        cast: [],
        rating: 4.9,
        episodes_count: 120,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Chinese_cuisine_montage.png/220px-Chinese_cuisine_montage.png",
        level: "Intermediate",
        category: "cooking",
        sections: [{
            id: 1,
            title: "ویدیوهای آشپزی",
            lessons: [
                { id: 9001, title: "回锅肉 (Huí Guō Ròu) - Twice-Cooked Pork", duration_minutes: 12, is_free: true },
                { id: 9002, title: "麻婆豆腐 (Má pó dòu fu) - Mapo Tofu", duration_minutes: 10, is_free: true },
                { id: 9003, title: "宫保鸡丁 (Gōng bǎo jī dīng) - Kung Pao Chicken", duration_minutes: 14, is_free: false },
                { id: 9004, title: "水煮鱼 (Shuǐ zhǔ yú) - Boiled Fish in Chili", duration_minutes: 16, is_free: false },
                { id: 9005, title: "红烧肉 (Hóng shāo ròu) - Red Braised Pork", duration_minutes: 18, is_free: false },
            ]
        }]
    },
    902: {
        id: 902,
        title: "A Bite of China / 舌尖上的中国",
        description: "نوک زبان چین - مستند پرطرفدار چینی درباره غذا و فرهنگ غذایی.",
        synopsis: "«یک گاز از چین» (舌尖上的中国) یکی از معروف‌ترین مستندهای چینی است که توسط تلویزیون مرکزی چین (CCTV) تولید شد. این مستند به بررسی فرهنگ غذایی مناطق مختلف چین می‌پردازد. از شمال تا جنوب، از شرق تا غرب، هر قسمت غذاهای محلی، روش‌های پخت سنتی و داستان‌های مردمی را نشان می‌دهد. زبان رسمی ماندارین با لهجه‌های محلی ترکیب شده.",
        genre: "مستند، فرهنگ غذایی، سفرنامه",
        year: 2012,
        host: "راوی: Li Lihong (李立宏)",
        accent: "ماندارین رسمی (普通话) - گویش استاندارد، فصیح و واضح، عالی برای تقویت شنیداری",
        cast: [],
        rating: 4.8,
        episodes_count: 21,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/A_Bite_of_China.jpg/220px-A_Bite_of_China.jpg",
        level: "Intermediate - Advanced",
        category: "cooking",
        sections: [{
            id: 1,
            title: "فصل اول",
            lessons: [
                { id: 9101, title: "自然的馈赠 (Gifts of Nature)", duration_minutes: 48, is_free: true },
                { id: 9102, title: "主食的故事 (The Story of Staples)", duration_minutes: 50, is_free: true },
                { id: 9103, title: "转化的灵感 (Inspiration of Transformation)", duration_minutes: 47, is_free: false },
                { id: 9104, title: "时间的味道 (Taste of Time)", duration_minutes: 49, is_free: false },
                { id: 9105, title: "厨房的秘密 (Secrets of the Kitchen)", duration_minutes: 46, is_free: false },
                { id: 9106, title: "五味的调和 (Harmony of Five Flavors)", duration_minutes: 50, is_free: false },
                { id: 9107, title: "我们的田野 (Our Fields)", duration_minutes: 48, is_free: false },
            ]
        }]
    },
    903: {
        id: 903,
        title: "Li Ziqi / 李子柒",
        description: "لی زیچی - ملکه ویدیوهای زندگی روستایی و آشپزی سنتی چینی.",
        synopsis: "لی زیچی (李子柒) پدیده اینترنتی چینی است که ویدیوهای آشپزی و زندگی روستایی خود را در سیچوان ضبط می‌کند. ویدیوهای او ترکیبی از آشپزی سنتی، صنایع‌دستی و طبیعت هستند. از تهیه سس سویا از صفر تا بافت لباس و ساخت مبلمان، لی زیچی هنر زندگی آرام و سنتی چینی را به نمایش می‌گذارد. ویدیوهایش بیشتر بدون دیالوگ هستند اما زیرنویس‌ها عالی برای یادگیری واژگان غذایی‌اند.",
        genre: "آشپزی سنتی، زندگی روستایی، صنایع‌دستی",
        year: 2016,
        host: "Li Ziqi (李子柒)",
        accent: "کمترین دیالوگ - بیشتر تصویری، مناسب یادگیری واژگان از طریق زیرنویس",
        cast: [],
        rating: 4.7,
        episodes_count: 80,
        cover_image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Chinese_food.jpg/220px-Chinese_food.jpg",
        level: "All Levels",
        category: "cooking",
        sections: [{
            id: 1,
            title: "ویدیوهای منتخب",
            lessons: [
                { id: 9201, title: "辣椒酱 (Là jiāo jiàng) - Making Chili Sauce", duration_minutes: 15, is_free: true },
                { id: 9202, title: "年夜饭 (Nián yè fàn) - New Year's Eve Dinner", duration_minutes: 20, is_free: true },
                { id: 9203, title: "酱油 (Jiàng yóu) - Making Soy Sauce", duration_minutes: 18, is_free: false },
                { id: 9204, title: "腊肠 (Là cháng) - Chinese Sausage", duration_minutes: 14, is_free: false },
            ]
        }]
    }
};

export default function CookingDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [show, setShow] = useState<CookingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShow = async () => {
            if (courseId && mockCooking[courseId]) {
                setShow(mockCooking[courseId]);
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/courses/${id}`);
                setShow(response.data);
            } catch (error) {
                if (courseId && mockCooking[courseId]) {
                    setShow(mockCooking[courseId]);
                } else if (!isHttpStatus(error, 404)) {
                    console.error("Failed to fetch cooking show:", error);
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
                <Link href="/explore/cooking" className="text-gray-600">
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
                        <div className="text-xs text-orange-600 font-bold mb-1 uppercase tracking-wide">
                            Chinese Cooking
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{show.title}</h1>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-0.5">
                                <Star size={14} className="text-orange-400 fill-orange-400" />
                                <span className="text-sm font-bold text-gray-800">{show.rating || 4.5}</span>
                            </div>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{show.year || 2017}</span>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className="text-xs text-gray-500">{show.episodes_count} قسمت</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {show.genre?.split('،').map((g, i) => (
                                <span key={i} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
                                    {g.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="w-28 flex-shrink-0">
                        <div className="aspect-square rounded-lg overflow-hidden shadow-md bg-gray-200">
                            <img src={show.cover_image_url} alt={show.title} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                {/* Show Info */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 text-sm mb-2">معرفی</h3>
                    <p className="text-gray-600 text-sm leading-relaxed text-justify mb-4">
                        {show.synopsis || show.description}
                    </p>

                    {show.genre && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">ژانر</h3>
                            <div className="flex flex-wrap gap-2">
                                {show.genre.split('،').map((g, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-orange-50 rounded-full px-3 py-1 border border-orange-100">
                                        <span className="text-xs text-orange-700">{g.trim()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {show.accent && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">لهجه و تلفظ</h3>
                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                <p className="text-gray-700 text-sm leading-relaxed">{show.accent}</p>
                            </div>
                        </div>
                    )}

                    {show.host && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-sm mb-2">میزبان / سرآشپز</h3>
                            <div className="flex items-center gap-2 bg-gray-50 rounded-full pr-1 pl-3 py-1 border border-gray-100 w-fit">
                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] text-orange-600 font-bold">
                                    {show.host[0]}
                                </div>
                                <span className="text-xs text-gray-700">{show.host}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Parts List */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Play size={20} className="text-orange-600" />
                        فهرست قسمت‌ها
                    </h3>
                    <div className="space-y-3">
                        {allParts.map((lesson, index) => (
                            <Link
                                key={lesson.id}
                                href={`/watch/cooking/${show.id}?lesson=${lesson.id}`}
                                className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-transform"
                            >
                                <div className="flex">
                                    <div className="w-28 h-20 bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                        <img src={getVideoThumbnail(lesson.id)} alt={lesson.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                <Play size={14} className="text-orange-600 fill-orange-600 ml-0.5" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded">
                                            {lesson.duration_minutes}:00
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
