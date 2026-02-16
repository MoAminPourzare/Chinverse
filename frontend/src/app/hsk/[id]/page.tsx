"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, BookOpen, Bookmark, MoreVertical, CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Course } from "@/lib/types";
import { lessonChineseTitles, persianNumbers } from "@/lib/videoUtils";

export default function HskDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons] = useState<number[]>([2001]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);
            } catch (error) {
                console.error("Failed to fetch HSK course:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCourse();
        }
    }, [id, courseId]);

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

    // Calculate totals
    const totalLessons = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.length || 0), 0
    ) || 0;
    const totalMinutes = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.reduce((s, l) => s + (l.duration_minutes || 0), 0) || 0), 0
    ) || 0;
    const totalHours = Math.round(totalMinutes / 60);

    // Flatten lessons
    const allLessons = course.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

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

            <main className="px-6 py-4">
                {/* HSK Title */}
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

                {/* HSK Book Cover */}
                <div className="flex justify-center mb-8">
                    <div className="w-48 h-64 rounded-xl overflow-hidden shadow-xl border-4 border-white relative bg-orange-500">
                        <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-orange-600 flex flex-col items-center justify-center p-4">
                            <div className="bg-blue-900 text-white text-xs px-2 py-1 rounded mb-2">标准教程</div>
                            <div className="text-white text-xs mb-1">STANDARD COURSE</div>
                            <div className="text-white text-6xl font-bold mb-1" dir="ltr">HSK</div>
                            <div className="text-white text-5xl font-bold">{course.level}</div>
                        </div>
                    </div>
                </div>

                {/* HSK Description */}
                <div className="mb-8">
                    <p className="text-gray-700 text-sm leading-relaxed text-justify">
                        کتاب HSK Standard Course {course.level} یکی از کتاب‌های رسمی و معتبر برای آموزش زبان چینی است.
                    </p>
                </div>

                {/* HSK Lesson List */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-600" />
                        فهرست درس‌ها
                    </h3>
                    <div className="space-y-3">
                        {allLessons.map((lesson, index) => {
                            const isCompleted = completedLessons.includes(lesson.id);
                            const progress = isCompleted ? 100 : (index === 0 ? 60 : 0);
                            const chineseTitle = lessonChineseTitles[index + 1] || "你好！";
                            const persianTitle = persianNumbers[index] || `${index + 1}`;

                            return (
                                <Link
                                    key={lesson.id}
                                    href={`/watch/hsk/${course.id}?lesson=${lesson.id}`}
                                    className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 active:scale-[0.99] transition-transform hover:shadow-md"
                                >
                                    <div className="flex">
                                        <div className="flex-1 p-4">
                                            <h4 className="font-bold text-gray-900 mb-1">درس {persianTitle}</h4>
                                            <p className="text-gray-600 text-sm mb-2" dir="ltr">{chineseTitle}</p>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-2">
                                                <div className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                {isCompleted ? (
                                                    <><CheckCircle size={14} className="text-green-500" /><span className="text-green-600">تکمیل شده</span></>
                                                ) : (
                                                    <span>{lesson.duration_minutes || 40} دقیقه</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-24 bg-gradient-to-b from-orange-400 to-orange-600 flex flex-col items-center justify-center p-2 text-white">
                                            <div className="text-base font-bold" dir="ltr">HSK</div>
                                            <div className="text-xl font-bold" dir="ltr">{course.level}</div>
                                            <div className="mt-1 bg-red-600 text-[8px] px-1.5 py-0.5 rounded">第 {index + 1} 课</div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
