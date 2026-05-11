"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    Bookmark,
    BookmarkCheck,
    BookOpen,
    Loader2,
    Play,
    Star,
} from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { isHttpStatus } from "@/lib/http";
import {
    Course,
    checkCourseSaved,
    getCourseMetaNumber,
    getCourseMetaString,
    getDisplayCount,
    mergeCourseMetadata,
    saveCourse,
    unsaveCourse,
} from "@/lib/courses";
import Surface from "@/components/ui/Surface";
import SectionHeader from "@/components/ui/SectionHeader";
import LessonCard from "@/components/course/LessonCard";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface CourseDetailPageProps {
    domain: string;
    explorePath: string;
    eyebrow: string;
    countLabel?: string;
    countKeys?: string[];
    accentClass?: string;
}

const splitList = (value: string) => value.split(/[、,]/).map((item) => item.trim()).filter(Boolean);

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
    accentClass = "from-rose-500 to-orange-500",
}: CourseDetailPageProps) {
    const params = useParams();
    const id = params?.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savingBookmark, setSavingBookmark] = useState(false);

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

    useEffect(() => {
        let cancelled = false;

        const fetchSavedState = async () => {
            if (!course?.id) {
                setIsSaved(false);
                return;
            }

            try {
                const saved = await checkCourseSaved(course.id);
                if (!cancelled) {
                    setIsSaved(saved);
                }
            } catch {
                if (!cancelled) {
                    setIsSaved(false);
                }
            }
        };

        fetchSavedState();

        return () => {
            cancelled = true;
        };
    }, [course?.id]);

    const lessons = useMemo(() => {
        return course?.sections?.flatMap((section) => section.lessons || []) || [];
    }, [course]);

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center bg-transparent">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                    <span>در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    if (notFound || !course) {
        return (
            <div className="min-h-full px-4 py-6" dir="rtl">
                <Surface className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <BookOpen size={28} />
                    </div>
                    <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">محتوا پیدا نشد</h1>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                        این محتوا در دیتابیس وجود ندارد یا هنوز seed نشده است.
                    </p>
                    <PrimaryButton href={explorePath} variant="secondary" className="mt-6">
                        بازگشت به کاوش
                    </PrimaryButton>
                </Surface>
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

    const handleToggleSaved = async () => {
        if (!course || savingBookmark) return;

        setSavingBookmark(true);
        try {
            if (isSaved) {
                await unsaveCourse(course.id);
                setIsSaved(false);
            } else {
                await saveCourse(course.id);
                setIsSaved(true);
            }
        } catch (error) {
            console.error("Failed to update saved course:", error);
            alert("برای ذخیره کردن دوره باید وارد حساب کاربری شوی.");
        } finally {
            setSavingBookmark(false);
        }
    };

    return (
        <div className="min-h-full pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
                <header className="sticky top-0 z-20">
                    <Surface className="flex items-center justify-between gap-3 px-4 py-3">
                        <Link href={explorePath} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                            <ArrowRight size={20} />
                        </Link>
                        <div className="min-w-0 flex-1 text-center">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">{eyebrow}</p>
                            <h1 className="mt-1 truncate text-base font-bold text-slate-900">{course.title}</h1>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleSaved}
                            disabled={savingBookmark}
                            aria-label={isSaved ? "حذف از منتخب‌ها" : "ذخیره در منتخب‌ها"}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                isSaved
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            }`}
                        >
                            {savingBookmark ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : isSaved ? (
                                <BookmarkCheck size={20} />
                            ) : (
                                <Bookmark size={20} />
                            )}
                        </button>
                    </Surface>
                </header>

                <Surface className="overflow-hidden">
                    <div className={`grid gap-5 p-5 ${hasPosterLayout ? "lg:grid-cols-[220px_1fr]" : "lg:grid-cols-[280px_1fr]"}`}>
                        <div className={`relative overflow-hidden rounded-[26px] bg-slate-100 ${hasPosterLayout ? "aspect-[2/3]" : "aspect-[4/3]"}`}>
                            {course.cover_image_url ? (
                                <Image
                                    src={course.cover_image_url}
                                    alt={course.title}
                                    fill
                                    sizes={hasPosterLayout ? "220px" : "(max-width: 768px) 100vw, 640px"}
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                    <BookOpen size={34} />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                                    {eyebrow}
                                </span>
                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {course.level}
                                </span>
                                {year > 0 && (
                                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        {year}
                                    </span>
                                )}
                            </div>

                            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{course.title}</h2>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{course.description}</p>

                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                {rating > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                                        <Star size={13} className="fill-current" />
                                        {rating}
                                    </span>
                                )}
                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                                    {countText}
                                </span>
                            </div>

                            {genre && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {splitList(genre).map((item) => (
                                        <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 flex flex-wrap gap-3">
                                {lessons[0] && (
                                    <PrimaryButton href={`/watch/${domain}/${course.id}?lesson=${lessons[0].id}`} leadingIcon={<Play size={16} />}>
                                        شروع
                                    </PrimaryButton>
                                )}
                                <PrimaryButton
                                    type="button"
                                    variant={isSaved ? "secondary" : "ghost"}
                                    leadingIcon={
                                        savingBookmark ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : isSaved ? (
                                            <BookmarkCheck size={16} />
                                        ) : (
                                            <Bookmark size={16} />
                                        )
                                    }
                                    onClick={handleToggleSaved}
                                    disabled={savingBookmark}
                                >
                                    {isSaved ? "ذخیره شد" : "ذخیره"}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </Surface>

                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <Surface className="p-5">
                        <SectionHeader title="معرفی" subtitle="توضیح کوتاه و خوانا درباره‌ی این course." />
                        <p className="mt-4 text-sm leading-8 text-slate-600">{synopsis}</p>
                    </Surface>

                    <Surface className="p-5">
                        <SectionHeader title="اطلاعات سریع" subtitle="چند نکته‌ی کاربردی درباره‌ی این محتوا." />
                        <div className="mt-4 space-y-3">
                            <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">سبک</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{course.level}</p>
                            </div>
                            <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">محتوا</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{countText}</p>
                            </div>
                            {year > 0 && (
                                <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">سال</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{year}</p>
                                </div>
                            )}
                        </div>
                    </Surface>
                </div>

                {(host || director || castList.length > 0) && (
                    <Surface className="p-5">
                        <SectionHeader title="افراد مرتبط" subtitle="آدم‌های اصلی پشت این محتوا." />
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[host, director, ...castList].filter(Boolean).map((person) => (
                                <span key={person} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                                    {person}
                                </span>
                            ))}
                        </div>
                    </Surface>
                )}

                <section className="space-y-4">
                    <SectionHeader
                        title="درس‌ها"
                        subtitle="هر درس به شکل یک کارت مرتب و قابل اسکن نمایش داده می‌شود."
                    />

                    <div className="space-y-4">
                        {sections.length === 0 ? (
                            <Surface className="p-5 text-sm text-slate-500">
                                هنوز ویدیویی برای این محتوا ثبت نشده است.
                            </Surface>
                        ) : (
                            sections.map((section) => {
                                const sectionSummary = getMetaString(section.metadata_json, "summary", "");
                                const sectionBadge = getMetaString(section.metadata_json, "badge", "");
                                const sectionNotes = getMetaArray(section.metadata_json, "notes");

                                return (
                                    <Surface key={section.id} className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h4 className="text-base font-bold text-slate-900">{section.title}</h4>
                                                {sectionSummary && <p className="mt-1 text-sm leading-6 text-slate-500">{sectionSummary}</p>}
                                            </div>
                                            {sectionBadge && (
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                                    {sectionBadge}
                                                </span>
                                            )}
                                        </div>

                                        {sectionNotes.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {sectionNotes.map((note) => (
                                                    <span key={note} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500">
                                                        {note}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-4 space-y-3">
                                            {(section.lessons || []).map((lesson, index) => {
                                                const lessonSummary = getMetaString(lesson.metadata_json, "summary", "");
                                                const lessonSubtitle = getMetaString(lesson.metadata_json, "subtitle", "");
                                                const durationLabel = getMetaString(
                                                    lesson.metadata_json,
                                                    "duration_label",
                                                    `${lesson.duration_minutes || 0} دقیقه`,
                                                );

                                                return (
                                                    <LessonCard
                                                        key={lesson.id}
                                                        href={`/watch/${domain}/${course.id}?lesson=${lesson.id}`}
                                                        index={index + 1}
                                                        title={lesson.title || `درس ${index + 1}`}
                                                        subtitle={lessonSubtitle}
                                                        summary={lessonSummary}
                                                        durationLabel={durationLabel}
                                                        accentClass={accentClass}
                                                        badge={lesson.is_free ? "رایگان" : undefined}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </Surface>
                                );
                            })
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
