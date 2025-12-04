"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Star, Clock, BookOpen } from "lucide-react";
import { useParams } from "next/navigation";

export default function CourseDetailPage() {
    const params = useParams();
    const id = params?.id;

    // Mock data - in real app, fetch based on ID
    const course = {
        title: `HSK ${id} Standard Course`,
        description: `HSK ${id} Standard Course is an authoritative textbook for HSK ${id} test. It is jointly published by Beijing Language and Culture University Press and Chinese Testing International (CTI).`,
        rating: 4.8,
        reviews: 120,
        level: "Intermediate",
        duration: "60 Hours",
        lessons: 20,
        color: "bg-orange-500", // Dynamic based on level
    };

    return (
        <div className="min-h-full bg-white pb-24 relative" dir="rtl">
            {/* Header / Cover */}
            <div className={`h-64 ${course.color} relative flex items-center justify-center`}>
                <Link href="/explore/hsk" className="absolute top-4 right-4 text-white z-10">
                    <ArrowRight size={24} />
                </Link>
                <div className="text-center text-white">
                    <div className="text-sm opacity-90 mb-1">STANDARD COURSE</div>
                    <div className="text-6xl font-bold mb-2">HSK {id}</div>
                    <div className="text-6xl font-bold opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 pointer-events-none">
                        {id}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 -mt-6 bg-white rounded-t-3xl relative z-0">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-2xl font-bold text-gray-900" dir="ltr">{course.title}</h1>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-yellow-700">{course.rating}</span>
                    </div>
                </div>

                <div className="flex gap-4 mb-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen size={16} />
                        <span>{course.lessons} Lessons</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-800">About this course</h2>
                    <p className="text-gray-600 leading-relaxed text-justify">
                        {course.description}
                    </p>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-20 max-w-md mx-auto">
                <Link
                    href={`/courses/${id}/lessons`}
                    className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-bold text-lg shadow-blue-200 shadow-lg active:scale-[0.98] transition-transform"
                >
                    دیدن همه درس‌ها
                </Link>
            </div>
        </div>
    );
}
