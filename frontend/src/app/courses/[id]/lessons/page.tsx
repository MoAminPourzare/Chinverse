"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle, CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";

export default function LessonListPage() {
    const params = useParams();
    const courseId = params?.id;

    // Mock data - fetch real lessons from API
    const lessons = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        title: `Lesson ${i + 1}`,
        subtitle: "你好！(Hello!)",
        duration: "45 min",
        isCompleted: i < 3, // Mock progress
        thumbnail: "/placeholder.jpg",
    }));

    return (
        <div className="min-h-full bg-gray-50 pb-20" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href={`/courses/${courseId}`} className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">HSK {courseId} - Lessons</h1>
            </header>

            {/* Lesson List */}
            <main className="p-4 space-y-3">
                {lessons.map((lesson) => (
                    <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className="block bg-white rounded-xl p-3 shadow-sm border border-gray-100 active:scale-[0.99] transition-transform"
                    >
                        <div className="flex gap-3">
                            {/* Thumbnail */}
                            <div className="w-24 aspect-video bg-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <PlayCircle size={24} className="opacity-50" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold text-blue-600 mb-1 block">
                                            درس {lesson.id}
                                        </span>
                                        {lesson.isCompleted && (
                                            <CheckCircle size={14} className="text-green-500" />
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{lesson.subtitle}</h3>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${lesson.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: lesson.isCompleted ? '100%' : '0%' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </main>
        </div>
    );
}
