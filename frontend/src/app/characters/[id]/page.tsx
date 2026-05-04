"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Bookmark, MoreVertical, CheckCircle, Play } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Course } from "@/lib/types";
import { getVideoThumbnail } from "@/lib/videoUtils";
import { isHttpStatus } from "@/lib/http";

// ==================== MOCK DATA ====================
const mockCharactersCourses: Record<number, Course> = {
    201: {
        id: 201,
        title: "Mandarin Blueprint",
        description: "یادگیری کاراکترهای چینی با متد Blueprint. این روش منحصربه‌فرد به شما کمک می‌کند هزاران کاراکتر را به خاطر بسپارید.",
        cover_image_url: "https://randomuser.me/api/portraits/men/32.jpg",
        level: "Beginner",
        category: "characters",
        sections: [{
            id: 1,
            title: "Foundations",
            lessons: [
                { id: 4001, title: "Introduction to Chinese Characters", duration_minutes: 15, is_free: true },
                { id: 4002, title: "Basic Strokes (Part 1)", duration_minutes: 18, is_free: true },
                { id: 4003, title: "Basic Strokes (Part 2)", duration_minutes: 16, is_free: false },
                { id: 4004, title: "Stroke Order Rules", duration_minutes: 20, is_free: false },
                { id: 4005, title: "Common Radicals (Part 1)", duration_minutes: 22, is_free: false },
                { id: 4006, title: "Common Radicals (Part 2)", duration_minutes: 19, is_free: false },
                { id: 4007, title: "Building Your First Characters", duration_minutes: 25, is_free: false },
                { id: 4008, title: "Memory Techniques", duration_minutes: 18, is_free: false },
            ]
        }]
    },
    202: {
        id: 202,
        title: "Hanzi Hero",
        description: "قهرمان کاراکترهای چینی شوید! با روش‌های گیمیفیکیشن و تمرین‌های تعاملی، نوشتن و خواندن چینی را یاد بگیرید.",
        cover_image_url: "https://randomuser.me/api/portraits/men/45.jpg",
        level: "Beginner",
        category: "characters",
        sections: [{
            id: 1,
            title: "Hero Training",
            lessons: [
                { id: 5001, title: "Your First 10 Characters", duration_minutes: 12, is_free: true },
                { id: 5002, title: "Understanding Components", duration_minutes: 15, is_free: true },
                { id: 5003, title: "Daily Practice Routine", duration_minutes: 10, is_free: false },
                { id: 5004, title: "Numbers 1-10", duration_minutes: 14, is_free: false },
                { id: 5005, title: "Basic Verbs", duration_minutes: 16, is_free: false },
                { id: 5006, title: "Time Characters", duration_minutes: 18, is_free: false },
            ]
        }]
    },
    203: {
        id: 203,
        title: "Grace Mandarin - Hanzi",
        description: "آموزش نوشتار چینی با گریس. از پایه‌ترین خطوط تا کاراکترهای پیچیده را با تمرین‌های عملی یاد بگیرید.",
        cover_image_url: "https://randomuser.me/api/portraits/women/44.jpg",
        level: "Intermediate",
        category: "characters",
        sections: [{
            id: 1,
            title: "Writing Mastery",
            lessons: [
                { id: 6001, title: "Perfecting Basic Strokes", duration_minutes: 20, is_free: true },
                { id: 6002, title: "Character Structure", duration_minutes: 18, is_free: true },
                { id: 6003, title: "Semantic Components", duration_minutes: 22, is_free: false },
                { id: 6004, title: "Phonetic Components", duration_minutes: 20, is_free: false },
                { id: 6005, title: "Common Character Pairs", duration_minutes: 25, is_free: false },
                { id: 6006, title: "Handwriting Practice", duration_minutes: 15, is_free: false },
                { id: 6007, title: "Reading Handwritten Text", duration_minutes: 18, is_free: false },
                { id: 6008, title: "Character Etymology", duration_minutes: 22, is_free: false },
                { id: 6009, title: "Advanced Radicals", duration_minutes: 24, is_free: false },
                { id: 6010, title: "Final Calligraphy Project", duration_minutes: 30, is_free: false },
            ]
        }]
    }
};

export default function CharactersDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons] = useState<number[]>([4001]);

    useEffect(() => {
        const fetchCourse = async () => {
            if (courseId && mockCharactersCourses[courseId]) {
                setCourse(mockCharactersCourses[courseId]);
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);
            } catch (error) {
                // Fallback to mock data
                if (courseId && mockCharactersCourses[courseId]) {
                    setCourse(mockCharactersCourses[courseId]);
                } else if (!isHttpStatus(error, 404)) {
                    console.error("Failed to fetch characters course:", error);
                }
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
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
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
                <Link href="/explore/characters" className="text-gray-600">
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
                {/* Instructor Image + Title */}
                <div className="flex flex-col items-center mb-6">
                    {/* Instructor Avatar */}
                    <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl border-4 border-white mb-4">
                        {course.cover_image_url ? (
                            <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                <span className="text-white text-3xl font-bold">{course.title[0]}</span>
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
                        {course.title}
                    </h1>
                    <p className="text-gray-500 text-sm text-center mb-2">
                        آموزش کاراکتر چینی | {totalLessons} درس
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} size={16} className={i <= 4 ? "text-orange-400 fill-orange-400" : "text-orange-400"} />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">(4.7)</span>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-6 bg-gray-50 rounded-2xl p-4">
                    <p className="text-gray-700 text-sm leading-relaxed text-justify">
                        {course.description}
                    </p>
                </div>

                {/* Course Info */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                        <div className="text-indigo-600 text-lg font-bold">{totalLessons}</div>
                        <div className="text-xs text-gray-600">درس</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                        <div className="text-green-600 text-lg font-bold">{totalMinutes}</div>
                        <div className="text-xs text-gray-600">دقیقه</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <div className="text-purple-600 text-lg font-bold">{course.level}</div>
                        <div className="text-xs text-gray-600">سطح</div>
                    </div>
                </div>

                {/* Lesson List with Thumbnails */}
                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Play size={20} className="text-purple-600" />
                        فهرست ویدیوها
                    </h3>

                    <div className="space-y-3">
                        {allLessons.map((lesson, index) => {
                            const isCompleted = completedLessons.includes(lesson.id);
                            const progress = isCompleted ? 100 : (index === 0 ? 45 : 0);
                            const thumbnail = getVideoThumbnail(lesson.id);

                            return (
                                <Link
                                    key={lesson.id}
                                    href={`/watch/characters/${course.id}?lesson=${lesson.id}`}
                                    className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 active:scale-[0.99] transition-transform hover:shadow-md"
                                >
                                    <div className="flex">
                                        {/* Thumbnail */}
                                        <div className="w-32 h-24 bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                            <img
                                                src={thumbnail}
                                                alt={lesson.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Play Overlay */}
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30">
                                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                    <Play size={18} className="text-purple-600 fill-purple-600 ml-0.5" />
                                                </div>
                                            </div>
                                            {/* Duration Badge */}
                                            <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                {lesson.duration_minutes}:00
                                            </div>
                                            {/* Completed Badge */}
                                            {isCompleted && (
                                                <div className="absolute top-1 right-1">
                                                    <CheckCircle size={18} className="text-green-500 fill-green-500 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-3 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-purple-600 font-medium">Lesson {index + 1}</span>
                                                {lesson.is_free && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">رایگان</span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1" dir="ltr">
                                                {lesson.title}
                                            </h4>

                                            {/* Progress Bar */}
                                            {progress > 0 && (
                                                <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-purple-500'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}
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
