"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bookmark, BookOpen, MoreVertical, Play, Star } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { isHttpStatus } from "@/lib/http";
import {
    Course,
    getCourseMetaNumber,
    getCourseMetaString,
    getDisplayCount,
    mergeCourseMetadata,
} from "@/lib/courses";

interface CourseDetailPageProps {
    domain: string;
    explorePath: string;
    eyebrow: string;
    countLabel?: string;
    countKeys?: string[];
    accentClass?: string;
}

const splitList = (value: string) => value.split(/[،,]/).map((item) => item.trim()).filter(Boolean);

const getMetaString = (meta: Record<string, unknown> | undefined, key: string, fallback = ""): string => {
    const value = meta?.[key];
    return typeof value === "string" ? value : fallback;
};

const getMetaArray = (meta: Record<string, unknown> | undefined, key: string): string[] => {
    const value = meta?.[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
};

export default function CourseDetailPage({
    domain,
    explorePath,
    eyebrow,
    countLabel = "قسمت",
    countKeys = ["episodes_count", "lesson_count"],
    accentClass = "bg-blue-600",
}: CourseDetailPageProps) {
    const params = useParams();
    const id = params?.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchCourse = async () => {
            setLoading(true);
            setNotFound(false);

            try {
                const response = await api.get(`/courses/${id}`);
                if (!cancelled) {
                    setCourse(mergeCourseMetadata(response.data));
                }
            } catch (error) {
                if (!isHttpStatus(error, 404)) {
                    console.error(`Failed to fetch ${domain} course:`, error);
                }
                if (!cancelled) {
                    setCourse(null);
                    setNotFound(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchCourse();
        }

        return () => {
            cancelled = true;
        };
    }, [domain, id]);

    const lessons = useMemo(() => {
        return course?.sections?.flatMap((section) => section.lessons || []) || [];
    }, [course]);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (notFound || !course) {
        return (
            <div className="min-h-full bg-gray-50 flex flex-col" dir="rtl">
                <header className="px-4 py-4 flex items-center gap-3 bg-white shadow-sm">
                    <Link href={explorePath} className="text-gray-600">
                        <ArrowRight size={24} />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-800">محتوا پیدا نشد</h1>
                </header>
                <main className="flex-1 flex items-center justify-center p-6 text-center text-gray-500">
                    این محتوا در دیتابیس وجود ندارد یا هنوز seed نشده است.
                </main>
            </div>
        );
    }

    const rating = getCourseMetaNumber(course, "rating", 0);
    const year = getCourseMetaNumber(course, "year", 0);
    const genre = getCourseMetaString(course, "genre", "");
    const synopsis = getCourseMetaString(course, "synopsis", course.description);
    const cast = course.metadata_json?.cast;
    const castList = Array.isArray(cast) ? cast.filter((item): item is string => typeof item === "string") : [];
    const host = getCourseMetaString(course, "host", "");
    const director = getCourseMetaString(course, "director", "");
    const countText = getDisplayCount(course, countKeys, countLabel);
    const hasPosterLayout = ["series", "movies", "cartoons", "reality"].includes(domain);
    const sections = course.sections || [];

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            <header className="px-4 py-4 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
                <Link href={explorePath} className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <h1 className="text-lg font-bold text-gray-800 line-clamp-1">{course.title}</h1>
                <button className="text-gray-600">
                    <MoreVertical size={22} />
                </button>
            </header>

            <main className="pb-6">
                <section className="bg-white px-4 py-5">
                    <div className={hasPosterLayout ? "grid grid-cols-[120px_1fr] gap-4 items-start" : "space-y-4"}>
                        <div className={`relative ${hasPosterLayout ? "aspect-[2/3]" : "aspect-video"} bg-gray-100 rounded-2xl overflow-hidden shadow-sm`}>
                            {course.cover_image_url ? (
                                <Image
                                    src={course.cover_image_url}
                                    alt={course.title}
                                    fill
                                    sizes={hasPosterLayout ? "120px" : "(max-width: 768px) 100vw, 640px"}
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <BookOpen size={34} />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <span className="inline-flex mb-2 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                                {eyebrow}
                            </span>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-3">{course.title}</h2>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                                {rating > 0 && (
                                    <span className="flex items-center gap-1 text-gray-800">
                                        <Star size={13} className="text-orange-400 fill-orange-400" />
                                        {rating}
                                    </span>
                                )}
                                {year > 0 && <span>{year}</span>}
                                <span>{countText}</span>
                                <span>{course.level}</span>
                            </div>

                            {genre && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {splitList(genre).map((item) => (
                                        <span key={item} className="text-[11px] text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                {lessons[0] && (
                                    <Link
                                        href={`/watch/${domain}/${course.id}?lesson=${lessons[0].id}`}
                                        className={`h-10 px-4 rounded-xl ${accentClass} text-white flex items-center gap-2 text-sm font-semibold`}
                                    >
                                        <Play size={17} className="fill-white" />
                                        شروع
                                    </Link>
                                )}
                                <button className="h-10 w-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                                    <Bookmark size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-4 py-5">
                    <h3 className="text-base font-bold text-gray-900 mb-2">معرفی</h3>
                    <p className="text-sm leading-7 text-gray-700">{synopsis}</p>
                </section>

                {(host || director || castList.length > 0) && (
                    <section className="px-4 pb-5">
                        <h3 className="text-base font-bold text-gray-900 mb-3">افراد مرتبط</h3>
                        <div className="flex flex-wrap gap-2">
                            {[host, director, ...castList].filter(Boolean).map((person) => (
                                <span key={person} className="text-xs text-gray-700 bg-white border border-gray-100 px-3 py-2 rounded-xl">
                                    {person}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                <section className="px-4">
                    <h3 className="text-base font-bold text-gray-900 mb-3">ویدیوها</h3>
                    <div className="space-y-5">
                        {sections.length === 0 ? (
                            <div className="text-sm text-gray-500 bg-white rounded-2xl p-4">
                                هنوز ویدیویی برای این محتوا ثبت نشده است.
                            </div>
                        ) : (
                            sections.map((section) => {
                                const sectionSummary = getMetaString(section.metadata_json, "summary", "");
                                const sectionBadge = getMetaString(section.metadata_json, "badge", "");
                                const sectionNotes = getMetaArray(section.metadata_json, "notes");

                                return (
                                    <div key={section.id} className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">{section.title}</h4>
                                                {sectionSummary && <p className="text-xs text-gray-500 mt-1">{sectionSummary}</p>}
                                            </div>
                                            {sectionBadge && (
                                                <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                                    {sectionBadge}
                                                </span>
                                            )}
                                        </div>

                                        {sectionNotes.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {sectionNotes.map((note) => (
                                                    <span key={note} className="text-[10px] text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-full">
                                                        {note}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {(section.lessons || []).map((lesson, index) => {
                                                const lessonSummary = getMetaString(lesson.metadata_json, "summary", "");
                                                const lessonSubtitle = getMetaString(lesson.metadata_json, "subtitle", "");
                                                const durationLabel = getMetaString(
                                                    lesson.metadata_json,
                                                    "duration_label",
                                                    `${lesson.duration_minutes || 0} دقیقه`,
                                                );

                                                return (
                                                    <Link
                                                        key={lesson.id}
                                                        href={`/watch/${domain}/${course.id}?lesson=${lesson.id}`}
                                                        className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-transform border border-gray-100"
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl ${accentClass} text-white flex items-center justify-center font-bold`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{lesson.title}</h4>
                                                            {lessonSubtitle && <p className="text-xs text-gray-500 line-clamp-1">{lessonSubtitle}</p>}
                                                            {lessonSummary && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{lessonSummary}</p>}
                                                            <p className="text-xs text-gray-500 mt-1">{durationLabel}</p>
                                                        </div>
                                                        <Play size={18} className="text-gray-400" />
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
