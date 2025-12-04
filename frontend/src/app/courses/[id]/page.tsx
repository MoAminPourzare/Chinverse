"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Clock, BookOpen } from "lucide-react";
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

// Color mapping for different course types
const courseColors: Record<string, string> = {
    "1": "bg-yellow-500",
    "2": "bg-teal-500",
    "3": "bg-orange-500",
    "4": "bg-red-600",
    "5": "bg-blue-600",
    "6": "bg-purple-600",
    "default": "bg-gradient-to-br from-blue-500 to-purple-600",
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
    const totalLessons = course.sections.reduce(
        (sum, section) => sum + section.lessons.length,
        0
    );
    const totalMinutes = course.sections.reduce(
        (sum, section) =>
            sum + section.lessons.reduce((s, l) => s + l.duration_minutes, 0),
        0
    );
    const totalHours = Math.round(totalMinutes / 60);

    // Determine cover color
    const coverColor = courseColors[course.level] || courseColors.default;

    return (
        <div className="min-h-full bg-white pb-24 relative" dir="rtl">
            {/* Cover Image / Header */}
            <div className={`h-80 ${coverColor} relative flex items-center justify-center`}>
                <Link
                    href="#"
                    onClick={() => window.history.back()}
                    className="absolute top-4 right-4 text-white z-10 bg-black bg-opacity-20 p-2 rounded-full"
                >
                    <ArrowRight size={24} />
                </Link>

                {/* Course Title on Cover */}
                <div className="text-center text-white px-6">
                    <div className="text-sm opacity-90 mb-2 tracking-wide">STANDARD COURSE</div>
                    <div className="text-6xl font-bold mb-2" dir="ltr">
                        {course.title.includes("HSK")
                            ? course.title.split(" ")[0] + " " + course.title.split(" ")[1]
                            : course.title.substring(0, 20)}
                    </div>
                </div>

                {/* Large watermark number for HSK */}
                {course.title.includes("HSK") && (
                    <div className="text-9xl font-bold text-white opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" dir="ltr">
                        {course.level}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-6 py-6 -mt-6 bg-white rounded-t-3xl relative z-10">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 flex-1" dir="ltr">
                        {course.title}
                    </h1>
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg ml-3">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-yellow-700">4.8</span>
                    </div>
                </div>

                {/* Metadata */}
                <div className="flex gap-4 mb-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <BookOpen size={16} />
                        <span>درس {totalLessons}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={16} />
                        <span>ساعت {totalHours}</span>
                    </div>
                </div>

                {/* About Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-800">درباره این دوره</h2>
                    <p className="text-gray-600 leading-relaxed text-justify">
                        {course.description}
                    </p>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-20 max-w-md mx-auto">
                <Link
                    href={`/courses/${id}/watch`}
                    className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-bold text-lg shadow-blue-200 shadow-lg active:scale-[0.98] transition-transform"
                >
                    مشاهده
                </Link>
            </div>
        </div>
    );
}
