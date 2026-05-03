"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import api from "@/lib/api";

interface Course {
    id: number;
    title: string;
    description: string;
    cover_image_url: string;
    level: string;
    sections?: Array<{
        lessons?: Array<{ id: number }>;
    }>;
}

// Mock grammar courses
const grammarCourses = [
    {
        id: 701,
        title: "HSK Grammar",
        subtitle: "گرامر جامع آزمون HSK",
        instructorImage: "https://randomuser.me/api/portraits/men/52.jpg",
        lessonCount: 24,
        progress: 15,
        color: "from-emerald-400 to-green-600"
    },
    {
        id: 702,
        title: "Chinese Grammar Wiki",
        subtitle: "دستورالعمل‌های گرامری چینی",
        instructorImage: "https://randomuser.me/api/portraits/women/55.jpg",
        lessonCount: 36,
        progress: 0,
        color: "from-blue-400 to-indigo-600"
    },
    {
        id: 703,
        title: "Grammar Patterns A2-B1",
        subtitle: "الگوهای گرامری سطح متوسط",
        instructorImage: "https://randomuser.me/api/portraits/men/33.jpg",
        lessonCount: 18,
        progress: 100,
        color: "from-violet-400 to-purple-600"
    },
];

export default function GrammarExplorePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=grammar`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch grammar courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const displayCourses = courses.length > 0 ? courses : [];

    return (
        <div className="min-h-full bg-gray-50 pb-20" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">گرامر</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {/* API Courses */}
                        {displayCourses.map((course) => {
                            const totalLessons = course.sections?.reduce(
                                (sum, s) => sum + (s.lessons?.length || 0), 0
                            ) || 10;

                            return (
                                <Link
                                    key={course.id}
                                    href={`/grammar/${course.id}`}
                                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center p-4 gap-4">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex-shrink-0 overflow-hidden">
                                            {course.cover_image_url ? (
                                                <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                                    {course.title[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{course.title}</h3>
                                            <p className="text-sm text-gray-500 mb-2 line-clamp-1">{course.description}</p>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `0%` }} />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{totalLessons} قسمت</span>
                                                <span className="text-emerald-500">{course.level}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Mock Courses */}
                        {displayCourses.length === 0 && grammarCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/grammar/${course.id}`}
                                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center p-4 gap-4">
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${course.color} flex-shrink-0 overflow-hidden`}>
                                        <img src={course.instructorImage} alt={course.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{course.title}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{course.subtitle}</p>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1">
                                            <div
                                                className={`h-full rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>{course.lessonCount} قسمت</span>
                                            {course.progress === 100 ? (
                                                <span className="text-green-500">تکمیل شده</span>
                                            ) : course.progress > 0 ? (
                                                <span className="text-emerald-500">{course.progress}% پیشرفت</span>
                                            ) : (
                                                <span>شروع نشده</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                        <Play size={18} className="text-emerald-600 fill-emerald-600 mr-0.5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
