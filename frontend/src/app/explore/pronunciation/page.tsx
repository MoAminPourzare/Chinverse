"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

// Mock course data for Pronunciation category with instructor images
const pronunciationCourses = [
    {
        id: 101,
        title: "Grace Mandarin",
        subtitle: "آموزش تلفظ چینی با گریس",
        instructorImage: "https://randomuser.me/api/portraits/women/44.jpg",
        lessonCount: 12,
        progress: 35,
        color: "from-pink-400 to-rose-500"
    },
    {
        id: 102,
        title: "Yoyo Chinese",
        subtitle: "تلفظ و پینین",
        instructorImage: "https://randomuser.me/api/portraits/women/68.jpg",
        lessonCount: 10,
        progress: 0,
        color: "from-amber-400 to-orange-500"
    },
    {
        id: 103,
        title: "Yang Yang",
        subtitle: "آموزش صداها و تون‌ها",
        instructorImage: "https://randomuser.me/api/portraits/women/32.jpg",
        lessonCount: 8,
        progress: 100,
        color: "from-cyan-400 to-teal-500"
    },
];

export default function PronunciationPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=pronunciation`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // Use mock data if no real courses
    const displayCourses = courses.length > 0 ? courses : [];

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">تلفظ</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {/* Show real courses if available */}
                        {displayCourses.map((course) => {
                            const totalLessons = course.sections?.reduce(
                                (sum, s) => sum + (s.lessons?.length || 0), 0
                            ) || 10;

                            return (
                                <Link
                                    key={course.id}
                                    href={`/pronunciation/${course.id}`}
                                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center p-4 gap-4">
                                        {/* Instructor Image */}
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 overflow-hidden">
                                            {course.cover_image_url ? (
                                                <img
                                                    src={course.cover_image_url}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                                    {course.title[0]}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                                                {course.description}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `0%` }}
                                                />
                                            </div>

                                            {/* Meta */}
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{totalLessons} قسمت</span>
                                                <span className="text-blue-500">{course.level}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Show mock courses if no real data */}
                        {displayCourses.length === 0 && pronunciationCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/pronunciation/${course.id}`}
                                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center p-4 gap-4">
                                    {/* Instructor Image */}
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${course.color} flex-shrink-0 overflow-hidden`}>
                                        <img
                                            src={course.instructorImage}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {course.subtitle}
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1">
                                            <div
                                                className={`h-full rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>{course.lessonCount} قسمت</span>
                                            {course.progress === 100 ? (
                                                <span className="text-green-500">تکمیل شده</span>
                                            ) : course.progress > 0 ? (
                                                <span className="text-blue-500">{course.progress}% پیشرفت</span>
                                            ) : (
                                                <span>شروع نشده</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Play Button */}
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <Play size={18} className="text-blue-600 fill-blue-600 mr-0.5" />
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
