"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface Course {
    id: number;
    title: string;
    description: string;
    cover_image_url: string;
    level: string;
}

const categoryConfig: Record<string, { title: string, cardStyle: 'landscape' | 'portrait' | 'square' }> = {
    pronunciation: { title: "تلفظ", cardStyle: 'square' },
    grammar: { title: "گرامر", cardStyle: 'square' },
    movies: { title: "فیلم و سریال", cardStyle: 'portrait' },
    cooking: { title: "آشپزی", cardStyle: 'landscape' },
    reality: { title: "ریالیتی شو", cardStyle: 'landscape' },
};

export default function CategoryPage() {
    const params = useParams();
    const category = params?.category as string;
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const config = categoryConfig[category] || { title: category, cardStyle: 'square' as const };

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get(`/courses?category_slug=${category}`);
                setCourses(response.data || []);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setLoading(false);
            }
        };

        if (category) {
            fetchCourses();
        }
    }, [category]);

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">{config.title}</h1>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        محتوایی در دسترس نیست.
                    </div>
                ) : (
                    <div className={
                        config.cardStyle === 'portrait'
                            ? 'grid grid-cols-2 gap-4'
                            : config.cardStyle === 'landscape'
                                ? 'space-y-4'
                                : 'grid grid-cols-2 gap-4'
                    }>
                        {courses.map((course) => {
                            // Resolve domain-specific route based on category
                            const domainRoutes: Record<string, string> = {
                                pronunciation: "pronunciation",
                                characters: "characters",
                                series: "series",
                                hsk: "hsk",
                            };
                            const routePrefix = domainRoutes[category] || category;

                            return (
                                <Link
                                    key={course.id}
                                    href={`/${routePrefix}/${course.id}`}
                                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                                >
                                    {/* Thumbnail */}
                                    <div className={`
                  ${config.cardStyle === 'portrait' ? 'aspect-[2/3]' : ''}
                  ${config.cardStyle === 'landscape' ? 'aspect-video' : ''}
                  ${config.cardStyle === 'square' ? 'aspect-square' : ''}
                  bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden group
                `}>
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all">
                                            <div className="w-16 h-16 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <Play size={28} className="text-blue-600 fill-blue-600 ml-1" />
                                            </div>
                                        </div>
                                        {/* Placeholder Text */}
                                        <span className="absolute top-2 left-2 text-white text-xs opacity-50 bg-black bg-opacity-20 px-2 py-1 rounded">
                                            Cover
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1">
                                            {course.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                            {course.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-blue-600 font-medium">{course.level}</span>
                                            <span className="text-xs text-gray-400">مشاهده</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
