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
import Surface from "@/components/ui/Surface";
import SectionHeader from "@/components/ui/SectionHeader";

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
    "1": "from-amber-400 to-orange-500",
    "2": "from-cyan-500 to-sky-600",
    "3": "from-orange-400 to-amber-500",
    "4": "from-rose-500 to-red-600",
    "5": "from-blue-500 to-indigo-600",
    "6": "from-violet-500 to-purple-600",
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
        <div className="min-h-full pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
                <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#334155_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <div className="p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <Link
                                href="/explore"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
                                aria-label="بازگشت به کاوش"
                            >
                                <ArrowRight size={19} />
                            </Link>
                            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/80">
                                Explore
                            </div>
                        </div>
                        <div className="mt-4 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">مسیر آموزشی</p>
                                <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                                    دوره‌های {title} را ببین، مسیر مناسب خودت را انتخاب کن و از همان‌جا وارد درس‌ها شو.
                                </p>
                            </div>
                        </div>
                    </div>
                </Surface>

                {loading ? (
                    <Surface className="p-8 text-center text-sm text-slate-500">
                        در حال بارگذاری...
                    </Surface>
                ) : error ? (
                    <Surface className="p-8 text-center text-sm text-slate-500">
                        ارتباط با سرور برقرار نشد.
                    </Surface>
                ) : orderedCourses.length === 0 ? (
                    <Surface className="p-8 text-center text-sm text-slate-500">
                        هنوز محتوایی برای این بخش ثبت نشده است.
                    </Surface>
                ) : layout === "hsk" ? (
                    <section className="space-y-3">
                        <SectionHeader
                            title="سطوح HSK"
                            subtitle="هر سطح به شکل یک کارت رنگی و واضح."
                        />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {orderedCourses.map((course) => {
                                const hskLevel = String(getCourseMetaNumber(course, "hsk_level", Number(course.level) || 0) || course.level);
                                const wordCount = ["150", "300", "600", "1200", "2500", "5000"][Number(hskLevel) - 1];

                                return (
                                    <Link key={course.id} href={getCourseHref(detailPath, course)} className="group">
                                        <Surface className={`overflow-hidden border-0 bg-gradient-to-br ${hskColors[hskLevel] || "from-slate-900 to-slate-600"} text-white shadow-[0_20px_45px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover:-translate-y-0.5`}>
                                            <div className="flex aspect-[4/5] flex-col justify-between p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                                                        Standard Course
                                                    </div>
                                                    <div className="rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white/85">
                                                        HSK {hskLevel}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="text-center">
                                                        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">HSK</div>
                                                        <div className="font-latin mt-1 text-[2.65rem] font-black leading-none sm:text-5xl" lang="en">HSK {hskLevel}</div>
                                                    </div>
                                                    <p className="text-center text-xs font-medium text-white/80">
                                                        {wordCount ? `${wordCount} واژه` : course.level}
                                                    </p>
                                                </div>
                                            </div>
                                        </Surface>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                ) : layout === "list" ? (
                    <section className="space-y-3">
                        <SectionHeader
                            title={title}
                            subtitle="کارت‌های فهرستی برای مرور سریع و مقایسه‌ی آسان."
                        />
                        <div className="grid gap-3">
                            {orderedCourses.map((course) => {
                                const totalLessons = getLessonCount(course);

                                return (
                                    <Link key={course.id} href={getCourseHref(detailPath, course)}>
                                        <Surface className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
                                            <div className="flex items-center gap-4 p-4">
                                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-slate-100">
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
                                                        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accentClass} text-white`}>
                                                            <BookOpen size={26} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">{course.title}</h3>
                                                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{course.description}</p>
                                                        </div>
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                                            <Play size={18} className="fill-current" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                                                                {totalLessons || getCourseMetaNumber(course, "lesson_count", 0)} {countLabel}
                                                            </span>
                                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                                                                {course.level}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Surface>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    <section className="space-y-3">
                        <SectionHeader
                            title={title}
                            subtitle="پوسترها را مرور کن و وارد صفحه‌ی هر course شو."
                        />
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                            {orderedCourses.map((course) => {
                                const rating = getCourseMetaNumber(course, "rating", 0);
                                const year = getCourseMetaNumber(course, "year", 0);
                                const countText = getDisplayCount(course, countKeys, countLabel);

                                return (
                                    <Link
                                        key={course.id}
                                        href={getCourseHref(detailPath, course)}
                                        className="group"
                                    >
                                        <Surface className="overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
                                            <div className={`${layout === "portrait" ? "aspect-[2/3]" : "aspect-square"} relative bg-slate-100`}>
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
                                                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accentClass} text-white`}>
                                                        <BookOpen size={28} />
                                                    </div>
                                                )}

                                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent" />
                                                <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                                                    {year || countText}
                                                </div>
                                            </div>

                                            <div className="p-3">
                                                <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{course.title}</h3>
                                                {year > 0 && <p className="mt-1 text-[11px] text-slate-500">{year}</p>}
                                                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                    {rating > 0 && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                                                            <Star size={12} className="fill-current" />
                                                            {rating}
                                                        </span>
                                                    )}
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                                                        {countText}
                                                    </span>
                                                </div>
                                            </div>
                                        </Surface>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
