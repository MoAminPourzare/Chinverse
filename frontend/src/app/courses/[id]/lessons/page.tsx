"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, MoreVertical, CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface Lesson {
    id: number;
    title: string;
    duration_minutes: number;
    is_free: boolean;
}

interface Section {
    id: number;
    title: string;
    lessons: Lesson[];
}

interface Course {
    id: number;
    title: string;
    level: string;
    sections: Section[];
}

// Sample Chinese titles for each lesson
const lessonChineseTitles: Record<number, string> = {
    1: "周末你有什么打算？",
    2: "他什么时候回来？",
    3: "桌子上放着很多饮料。",
    4: "她总是笑着跟客人说话。",
    5: "你去哪儿我就去哪儿",
    6: "除了这个还有别的吗？",
    7: "你看起来很高兴",
    8: "我听了三遍才听懂",
    9: "这个字怎么念？",
    10: "你把书放在桌子上",
};

export default function LessonListPage() {
    const params = useParams();
    const courseId = params?.id;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState<number[]>([2]); // Mock: lesson 2 completed

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${courseId}`);
                setCourse(response.data);
            } catch (error) {
                console.error("Failed to fetch course:", error);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

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

    // Flatten all lessons
    const allLessons = course.sections?.flatMap((section, sectionIndex) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: sectionIndex * 10 + lessonIndex + 1
        })) || []
    ) || [];

    // Persian lesson numbers
    const persianNumbers = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم", "هشتم", "نهم", "دهم"];

    return (
        <div className="min-h-full bg-gray-100 pb-6" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <button className="text-gray-600">
                        <MoreVertical size={22} />
                    </button>
                    <button className="text-gray-600">
                        <Bookmark size={22} />
                    </button>
                </div>
                <h1 className="text-lg font-bold text-gray-900" dir="ltr">
                    HSK {course.level}
                </h1>
                <Link href={`/courses/${courseId}`} className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
            </header>

            {/* Lesson List */}
            <main className="p-4 space-y-4">
                {allLessons.map((lesson, index) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    const progress = isCompleted ? 100 : (index === 0 ? 60 : 0);
                    const lessonNumber = index + 1;
                    const chineseTitle = lessonChineseTitles[lessonNumber] || "你好！";
                    const persianTitle = persianNumbers[index] || `${lessonNumber}`;

                    return (
                        <Link
                            key={lesson.id}
                            href={`/courses/${courseId}/watch?lesson=${lesson.id}`}
                            className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-transform"
                        >
                            <div className="flex">
                                {/* Content */}
                                <div className="flex-1 p-4">
                                    <h3 className="font-bold text-gray-900 mb-1">درس {persianTitle}</h3>
                                    <p className="text-gray-600 text-sm mb-3" dir="ltr">{chineseTitle}</p>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                                        <div
                                            className={`h-full rounded-full transition-all ${isCompleted ? 'bg-blue-500' : 'bg-blue-400'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        {isCompleted ? (
                                            <>
                                                <CheckCircle size={14} className="text-green-500" />
                                                <span className="text-green-600">دیده شده</span>
                                            </>
                                        ) : (
                                            <span>{lesson.duration_minutes || 40} دقیقه مانده تا پایان</span>
                                        )}
                                    </div>
                                </div>

                                {/* Lesson Thumbnail */}
                                <div className="w-28 bg-gradient-to-b from-orange-400 to-orange-600 flex flex-col items-center justify-center p-2 text-white">
                                    <div className="text-[8px] mb-0.5">Say Nihao</div>
                                    <div className="text-lg font-bold" dir="ltr">HSK</div>
                                    <div className="text-2xl font-bold" dir="ltr">{course.level}</div>
                                    <div className="mt-1 bg-red-600 text-[8px] px-1 rounded">
                                        第 {lessonNumber} 课
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </main>
        </div>
    );
}
