"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Clock, BookOpen, Bookmark, MoreVertical } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface Course {
    id: number;
    title: string;
    description: string;
    cover_image_url: string;
    level: string;
    sections: Array<{
        lessons: Array<{
            id: number;
            duration_minutes: number;
        }>;
    }>;
}

// HSK Book Cover URLs (orange book design)
const hskBookCovers: Record<string, string> = {
    "1": "https://images-na.ssl-images-amazon.com/images/I/51L+Q5wvNML.jpg",
    "2": "https://images-na.ssl-images-amazon.com/images/I/51L+Q5wvNML.jpg",
    "3": "https://images-na.ssl-images-amazon.com/images/I/51L+Q5wvNML.jpg",
    "4": "https://images-na.ssl-images-amazon.com/images/I/51L+Q5wvNML.jpg",
    "5": "https://images-na.ssl-images-amazon.com/images/I/51L+Q5wvNML.jpg",
    "6": "https://images-na.ssl-images-amazon.com/images/I/51L+Q5wvNML.jpg",
};

export default function CourseDetailPage() {
    const params = useParams();
    const id = params?.id;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);
            } catch (error) {
                console.error("Failed to fetch course:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCourse();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">دوره یافت نشد</div>
            </div>
        );
    }

    // Calculate total lessons and duration
    const totalLessons = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.length || 0),
        0
    ) || 0;
    const totalMinutes = course.sections?.reduce(
        (sum, section) =>
            sum + (section.lessons?.reduce((s, l) => s + (l.duration_minutes || 0), 0) || 0),
        0
    ) || 0;
    const totalHours = Math.round(totalMinutes / 60);

    // Get book cover
    const bookCover = hskBookCovers[course.level] || hskBookCovers["3"];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/hsk" className="text-gray-600">
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

            {/* Main Content */}
            <main className="px-6 py-4">
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-1" dir="ltr">
                    HSK {course.level}
                </h1>
                <p className="text-gray-500 text-sm text-center mb-4">
                    یادگیری زبان چینی | {totalHours > 0 ? `${totalHours} ساعت` : `${totalMinutes} دقیقه`}
                </p>

                {/* Rating */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4].map((i) => (
                            <Star key={i} size={18} className="text-orange-400 fill-orange-400" />
                        ))}
                        <Star size={18} className="text-orange-400" />
                    </div>
                    <span className="text-xs text-blue-600 underline">ثبت نظر</span>
                </div>

                {/* Book Cover Image */}
                <div className="flex justify-center mb-8">
                    <div className="w-48 h-64 rounded-xl overflow-hidden shadow-xl border-4 border-white relative bg-orange-500">
                        {/* Fallback HSK Book Design */}
                        <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-orange-600 flex flex-col items-center justify-center p-4">
                            <div className="bg-blue-900 text-white text-xs px-2 py-1 rounded mb-2">标准教程</div>
                            <div className="text-white text-xs mb-1">STANDARD COURSE</div>
                            <div className="text-white text-6xl font-bold mb-1" dir="ltr">HSK</div>
                            <div className="text-white text-5xl font-bold">{course.level}</div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                    <p className="text-gray-700 text-sm leading-relaxed text-justify">
                        کتاب " 《HSK标准教程》HSK 3" یا به انگلیسی "HSK Standard Course 3" یکی از کتاب‌های رسمی و معتبر برای آموزش زبان چینی در سطح HSK 3 است که توسط Hanban / Confucius Institute Headquarters (نهاد برگذارکننده آزمون HSK) منتشر شده.
                    </p>
                </div>

                {/* Book Specifications */}
                <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">مشخصات کلی کتاب:</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span><strong>سطح:</strong> متوسط (معادل HSK 3)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span><strong>مخاطب:</strong> زبان‌آموزانی که HSK 2 را گذرانده‌اند و حدود ۳۰۰ واژه چینی بلدند</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span><strong>تعداد درس‌ها:</strong> {totalLessons} درس</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span><strong>محتوا:</strong> ترکیبی از درس‌های گرامر، واژگان، مکالمه، درک مطلب و شنیداری</span>
                        </li>
                    </ul>
                </div>

                {/* Learning Objectives */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">اهداف یادگیری</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>افزایش دایره واژگان از ۳۰۰ به ۶۰۰ واژه (مجموع)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>آمادگی برای شرکت در آزمون رسمی HSK سطح ۳</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>توانایی برقراری مکالمات ساده تا نیمه‌پیشرفته در زندگی روزمره، محیط کار و تحصیل</span>
                        </li>
                    </ul>
                </div>
                {/* View All Lessons Button - Static at bottom of content */}
                <div className="mt-8 mb-24">
                    <Link
                        href={`/courses/${id}/lessons`}
                        className="block w-full bg-blue-600 text-white text-center py-4 rounded-2xl font-bold text-lg shadow-blue-200 shadow-lg active:scale-[0.98] transition-transform"
                    >
                        دیدن همه درس‌ها
                    </Link>
                </div>
            </main>
        </div>
    );
}
