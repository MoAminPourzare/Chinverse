"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Play, Star } from "lucide-react";
import {
    Course,
    fetchCoursesBySubcategory,
    getCourseMetaNumber,
    getDisplayCount,
    getLessonCount,
} from "@/lib/courses";

type CourseExploreLayout = "hsk" | "list" | "portrait" | "square";

interface CourseExplorePageProps {
    title: string;
    subcategorySlug: string;
    detailPath: string;
    layout: CourseExploreLayout;
    countLabel?: string;
    countKeys?: string[];
    accentClass?: string;
}

const hskColors: Record<string, string> = {
    "1": "bg-yellow-400",
    "2": "bg-teal-500",
    "3": "bg-orange-500",
    "4": "bg-red-600",
    "5": "bg-blue-600",
    "6": "bg-purple-600",
};

const getCourseHref = (detailPath: string, course: Course) => `${detailPath}/${course.id}`;

export default function CourseExplorePage({
    title,
    subcategorySlug,
    detailPath,
    layout,
    countLabel = "قسمت",
    countKeys = ["episodes_count"],
    accentClass = "bg-blue-500",
}: CourseExplorePageProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchCourses = async () => {
            setLoading(true);
            setError(false);

            try {
                const data = await fetchCoursesBySubcategory(subcategorySlug);
                if (!cancelled) {
                    setCourses(data);
                }
            } catch (fetchError) {
                console.error(`Failed to fetch ${subcategorySlug} courses:`, fetchError);
                if (!cancelled) {
                    setCourses([]);
                    setError(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchCourses();

        return () => {
            cancelled = true;
        };
    }, [subcategorySlug]);

    const orderedCourses = useMemo(() => {
        if (layout !== "hsk") {
            return courses;
        }

        return [...courses].sort((a, b) => {
            const aLevel = getCourseMetaNumber(a, "hsk_level", Number(a.level) || a.id);
            const bLevel = getCourseMetaNumber(b, "hsk_level", Number(b.level) || b.id);
            return aLevel - bLevel;
        });
    }, [courses, layout]);

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm sticky top-0 z-10">
                <Link href="/explore" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            </header>

            <main className="p-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
                ) : error ? (
                    <div className="text-center py-10 text-gray-500">ارتباط با سرور برقرار نشد.</div>
                ) : orderedCourses.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">هنوز محتوایی برای این بخش ثبت نشده است.</div>
                ) : layout === "hsk" ? (
                    <div className="grid grid-cols-2 gap-4">
                        {orderedCourses.map((course) => {
                            const hskLevel = String(getCourseMetaNumber(course, "hsk_level", Number(course.level) || 0) || course.level);
                            const wordCount = ["150", "300", "600", "1200", "2500", "5000"][Number(hskLevel) - 1];

                            return (
                                <Link
                                    key={course.id}
                                    href={getCourseHref(detailPath, course)}
                                    className={`aspect-[4/5] ${hskColors[hskLevel] || "bg-blue-600"} rounded-2xl flex flex-col items-center justify-center text-white shadow-md active:scale-95 transition-transform`}
                                >
                                    <span className="text-xs opacity-90 mb-1">Standard Course</span>
                                    <span className="text-4xl font-bold mb-2">HSK {hskLevel}</span>
                                    <span className="text-xs opacity-90">{wordCount ? `${wordCount} Words` : course.level}</span>
                                </Link>
                            );
                        })}
                    </div>
                ) : layout === "list" ? (
                    <div className="grid grid-cols-1 gap-4">
                        {orderedCourses.map((course) => {
                            const totalLessons = getLessonCount(course);

                            return (
                                <Link
                                    key={course.id}
                                    href={getCourseHref(detailPath, course)}
                                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center p-4 gap-4">
                                        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 overflow-hidden">
                                            {course.cover_image_url ? (
                                                <Image
                                                    src={course.cover_image_url}
                                                    alt={course.title}
                                                    fill
                                                    sizes="80px"
                                                    className="object-cover"
                                                    unoptimized
                                                />
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
                                                <div className={`h-full ${accentClass} rounded-full`} style={{ width: "0%" }} />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{totalLessons || getCourseMetaNumber(course, "lesson_count", 0)} {countLabel}</span>
                                                <span>{course.level}</span>
                                            </div>
                                        </div>

                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <Play size={18} className="text-blue-600 fill-blue-600 mr-0.5" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {orderedCourses.map((course) => {
                            const rating = getCourseMetaNumber(course, "rating", 0);
                            const year = getCourseMetaNumber(course, "year", 0);
                            const countText = getDisplayCount(course, countKeys, countLabel);

                            return (
                                <Link
                                    key={course.id}
                                    href={getCourseHref(detailPath, course)}
                                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                                >
                                    <div className={`${layout === "portrait" ? "aspect-[2/3]" : "aspect-square"} bg-gray-200 relative`}>
                                        {course.cover_image_url ? (
                                            <Image
                                                src={course.cover_image_url}
                                                alt={course.title}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 220px"
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                                <BookOpen size={28} />
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                            {year || countText}
                                        </div>
                                    </div>

                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">{course.title}</h3>
                                            {year > 0 && <p className="text-xs text-gray-500">{year}</p>}
                                        </div>

                                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                                            {rating > 0 && (
                                                <>
                                                    <Star size={12} className="text-orange-400 fill-orange-400" />
                                                    <span>{rating}</span>
                                                </>
                                            )}
                                            {rating > 0 && <span className="text-gray-300 mx-1">|</span>}
                                            <span>{countText}</span>
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
