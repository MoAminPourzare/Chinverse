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
const mockGrammarCourses: Record<number, Course> = {
    701: {
        id: 701,
        title: "HSK Grammar",
        description: "آموزش گرامر جامع برای آزمون HSK سطح ۱ تا ۴. شامل ساختارهای جمله‌ای، حروف اضافه، زمان‌ها، و الگوهای جمله‌ای پرکاربرد در زبان چینی.",
        cover_image_url: "https://randomuser.me/api/portraits/men/52.jpg",
        level: "Beginner - Intermediate",
        category: "grammar",
        sections: [{
            id: 1,
            title: "Grammar Basics",
            lessons: [
                { id: 7001, title: "Word Order: Subject-Verb-Object", duration_minutes: 15, is_free: true },
                { id: 7002, title: "The Particle 的 (de)", duration_minutes: 12, is_free: true },
                { id: 7003, title: "了 (le) for Completed Actions", duration_minutes: 18, is_free: false },
                { id: 7004, title: "过 (guò) for Past Experience", duration_minutes: 14, is_free: false },
                { id: 7005, title: "着 (zhe) for Ongoing States", duration_minutes: 16, is_free: false },
                { id: 7006, title: "把 (bǎ) Sentence Structure", duration_minutes: 20, is_free: false },
            ]
        }]
    },
    702: {
        id: 702,
        title: "Chinese Grammar Wiki",
        description: "مرجع کامل گرامر چینی بر اساس Chinese Grammar Wiki. هر درس یک نکته گرامری را با مثال‌های کاربردی و تمرین توضیح می‌دهد.",
        cover_image_url: "https://randomuser.me/api/portraits/women/55.jpg",
        level: "All Levels",
        category: "grammar",
        sections: [{
            id: 1,
            title: "Essential Patterns",
            lessons: [
                { id: 7101, title: "是...的 (shì...de) Construction", duration_minutes: 10, is_free: true },
                { id: 7102, title: "比 (bǐ) Comparisons", duration_minutes: 13, is_free: true },
                { id: 7103, title: "Resultative Complements", duration_minutes: 17, is_free: false },
                { id: 7104, title: "Direction Complements", duration_minutes: 15, is_free: false },
                { id: 7105, title: "Potential Complements", duration_minutes: 14, is_free: false },
                { id: 7106, title: "越来越 (yuèláiyuè) Patterns", duration_minutes: 11, is_free: false },
                { id: 7107, title: "除了...以外 (chúle...yǐwài)", duration_minutes: 12, is_free: false },
                { id: 7108, title: "连...都/也 (lián...dōu/yě)", duration_minutes: 13, is_free: false },
            ]
        }]
    },
    703: {
        id: 703,
        title: "Grammar Patterns A2-B1",
        description: "الگوهای گرامری سطح متوسط زبان چینی. مناسب برای یادگیرندگانی که پایه‌های گرامر را فراگرفته‌اند و می‌خواهند ساختارهای پیچیده‌تر را یاد بگیرند.",
        cover_image_url: "https://randomuser.me/api/portraits/men/33.jpg",
        level: "Intermediate",
        category: "grammar",
        sections: [{
            id: 1,
            title: "Intermediate Grammar",
            lessons: [
                { id: 7201, title: "被 (bèi) Passive Voice", duration_minutes: 16, is_free: true },
                { id: 7202, title: "使/让/叫 Causative Constructions", duration_minutes: 14, is_free: true },
                { id: 7203, title: "不但...而且 Compound Sentences", duration_minutes: 18, is_free: false },
                { id: 7204, title: "虽然...但是 Concessive Clauses", duration_minutes: 15, is_free: false },
                { id: 7205, title: "Rhetorical Questions with 难道", duration_minutes: 12, is_free: false },
            ]
        }]
    }
};

export default function GrammarDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons] = useState<number[]>([7001]);

    useEffect(() => {
        const fetchCourse = async () => {
            if (courseId && mockGrammarCourses[courseId]) {
                setCourse(mockGrammarCourses[courseId]);
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);
            } catch (error) {
                if (courseId && mockGrammarCourses[courseId]) {
                    setCourse(mockGrammarCourses[courseId]);
                } else if (!isHttpStatus(error, 404)) {
                    console.error("Failed to fetch grammar course:", error);
                }
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCourse();
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

    const totalLessons = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.length || 0), 0
    ) || 0;
    const totalMinutes = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.reduce((s, l) => s + (l.duration_minutes || 0), 0) || 0), 0
    ) || 0;
    const allLessons = course.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/grammar" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <button className="text-gray-600"><Bookmark size={22} /></button>
                    <button className="text-gray-600"><MoreVertical size={22} /></button>
                </div>
            </header>

            <main className="px-6 py-4">
                {/* Instructor Image + Title */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl border-4 border-white mb-4">
                        {course.cover_image_url ? (
                            <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                                <span className="text-white text-3xl font-bold">{course.title[0]}</span>
                            </div>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">{course.title}</h1>
                    <p className="text-gray-500 text-sm text-center mb-2">آموزش گرامر چینی | {totalLessons} درس</p>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} size={16} className={i <= 4 ? "text-orange-400 fill-orange-400" : "text-orange-400"} />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">(4.6)</span>
                    </div>
                </div>

                <div className="mb-6 bg-gray-50 rounded-2xl p-4">
                    <p className="text-gray-700 text-sm leading-relaxed text-justify">{course.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <div className="text-emerald-600 text-lg font-bold">{totalLessons}</div>
                        <div className="text-xs text-gray-600">درس</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                        <div className="text-green-600 text-lg font-bold">{totalMinutes}</div>
                        <div className="text-xs text-gray-600">دقیقه</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-blue-600 text-lg font-bold">{course.level}</div>
                        <div className="text-xs text-gray-600">سطح</div>
                    </div>
                </div>

                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Play size={20} className="text-emerald-600" />
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
                                    href={`/watch/grammar/${course.id}?lesson=${lesson.id}`}
                                    className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 active:scale-[0.99] transition-transform hover:shadow-md"
                                >
                                    <div className="flex">
                                        <div className="w-32 h-24 bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                            <img src={thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                    <Play size={18} className="text-emerald-600 fill-emerald-600 ml-0.5" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                {lesson.duration_minutes}:00
                                            </div>
                                            {isCompleted && (
                                                <div className="absolute top-1 right-1">
                                                    <CheckCircle size={18} className="text-green-500 fill-green-500 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-emerald-600 font-medium">Lesson {index + 1}</span>
                                                {lesson.is_free && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">رایگان</span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1" dir="ltr">{lesson.title}</h4>
                                            {progress > 0 && (
                                                <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-emerald-500'}`}
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
