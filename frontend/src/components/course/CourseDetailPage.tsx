"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
    Bookmark,
    BookmarkCheck,
    BookOpen,
    Loader2,
    MoreVertical,
    Play,
    Star,
} from "lucide-react";
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
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps } from "@/lib/textDirection";
import Surface from "@/components/ui/Surface";
import LessonCard from "@/components/course/LessonCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { BackButton } from "@/components/ui/IconButton";
import LikeButton from "@/components/engagement/LikeButton";

interface CourseDetailPageProps {
    domain: string;
    explorePath: string;
    eyebrow: string;
    countLabel?: string;
    countKeys?: string[];
    accentClass?: string;
}

const domainLabels: Record<string, string> = {
    hsk: "HSK",
    pronunciation: "تلفظ",
    characters: "کاراکتر",
    grammar: "گرامر",
    idioms: "اصطلاحات",
    practical: "چینی کاربردی",
    vlogs: "یادگیری با ولاگ",
    synonyms: "واژگان هم‌معنی",
    classical: "زبان چینی کلاسیک",
    series: "سریال",
    movies: "فیلم",
    cartoons: "کارتون و انیمیشن",
    podcasts: "پادکست",
    music: "موسیقی",
    reality: "ریالیتی شو",
    "topic-talks": "گفتارهای موضوعی",
    "arts-cooking": "آشپزی",
    "martial-arts": "هنرهای رزمی",
    "energy-health": "تمرینات انرژی و سلامت",
    calligraphy: "خطاطی",
    "tea-culture": "فرهنگ چای",
    "culture-texts": "متون کلاسیک آموزشی",
    "historical-stories": "داستان‌های تاریخی",
    "classical-poetry": "شعر و ادبیات کلاسیک",
    "festivals-customs": "آیین‌ها و جشن‌ها",
};

const isBrokenText = (value?: string) => Boolean(value && /[ØÙÚÛâ]/.test(value));
const splitList = (value: string) => value.split(/[،,]/).map((item) => item.trim()).filter(Boolean);

const getMetaString = (meta: Record<string, unknown> | undefined, key: string, fallback = ""): string => {
    const value = meta?.[key];
    return typeof value === "string" ? value : fallback;
};

export default function CourseDetailPage({
    domain,
    explorePath,
    eyebrow,
    countLabel = "قسمت",
    countKeys = ["episodes_count", "lesson_count"],
}: CourseDetailPageProps) {
    const params = useParams();
    const id = params?.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savingBookmark, setSavingBookmark] = useState(false);

    const label = domainLabels[domain] || (isBrokenText(eyebrow) ? "دوره" : eyebrow);
    const cleanCountLabel = isBrokenText(countLabel) ? "درس" : countLabel;

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
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa]">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
                    <span>در حال بارگذاری…</span>
                </div>
            </div>
        );
    }

    if (notFound || !course) {
        return (
            <div className="min-h-full bg-[#f7f8fa] px-4 py-6" dir="rtl">
                <Surface className="mx-auto flex min-h-[50vh] max-w-[430px] flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#eef6ff] text-[#155aa6]">
                        <BookOpen size={28} />
                    </div>
                    <h1 className="mt-5 text-xl font-black text-slate-900">محتوا پیدا نشد</h1>
                    <p className="mt-3 max-w-xs text-sm leading-7 text-slate-500">
                        این محتوا در دیتابیس وجود ندارد یا هنوز برای این بخش ساخته نشده است.
                    </p>
                    <PrimaryButton href={explorePath} className="mt-6">
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
    const countText = getDisplayCount(course, countKeys, cleanCountLabel);
    const hasPosterLayout = ["series", "movies", "cartoons", "reality"].includes(domain);
    const sections = lessons.length > 0 ? [{ id: "all-lessons", title: "", lessons, metadata_json: {} }] : [];
    const courseTitleProps = getDirectionalTextProps(course.title);
    const courseDescriptionProps = getDirectionalTextProps(course.description);
    const synopsisProps = getDirectionalTextProps(synopsis);

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
        <div className="min-h-full bg-[#f7f8fa] pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-3 px-4 py-5">
                <header className="sticky top-0 z-20 -mx-4 bg-[#f7f8fa]/90 px-4 py-2 backdrop-blur">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        <BackButton href={explorePath} className="justify-self-end" />
                        <div className="min-w-0 flex-1 text-center">
                            <p className="text-[11px] font-black text-[#155aa6]">{label}</p>
                            <h1 className="truncate text-sm font-black text-slate-900" {...courseTitleProps}>{course.title}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleToggleSaved}
                                disabled={savingBookmark}
                                aria-label={isSaved ? "حذف از منتخب‌ها" : "ذخیره در منتخب‌ها"}
                                className={`flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    isSaved
                                        ? "bg-[#155aa6] text-white"
                                        : "bg-white text-[#155aa6] shadow-sm ring-1 ring-[#dfe6f0] hover:bg-[#eef6ff]"
                                }`}
                            >
                                {savingBookmark ? <Loader2 size={19} className="animate-spin" /> : isSaved ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
                            </button>
                            <Link
                                href="/settings/appearance"
                                aria-label="تنظیمات نمایش درس"
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-[#dfe6f0] transition hover:bg-[#eef6ff]"
                            >
                                <MoreVertical size={20} />
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="overflow-hidden rounded-[24px] border border-[#dfe6f0] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                    <div className={`relative bg-slate-100 ${hasPosterLayout ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
                        {course.cover_image_url ? (
                            <Image
                                src={getMediaUrl(course.cover_image_url)}
                                alt={course.title}
                                fill
                                sizes="430px"
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#155aa6] to-[#0f4e92] text-white">
                                <BookOpen size={34} />
                            </div>
                        )}
                    </div>

                    <div className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6]">{label}</span>
                            {course.level && <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">{course.level}</span>}
                            {year > 0 && <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">{year}</span>}
                        </div>

                        <h2 className="mt-3 text-[22px] font-black leading-9 text-slate-950" {...courseTitleProps}>{course.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-slate-600" {...courseDescriptionProps}>{course.description}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {rating > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-black text-[#155aa6]">
                                    <Star size={13} className="fill-current" />
                                    {rating}
                                </span>
                            )}
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{countText}</span>
                        </div>

                        {genre && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {splitList(genre).map((item) => (
                                    <span key={item} className="rounded-full border border-[#dfe6f0] bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="mt-5 flex flex-wrap gap-2">
                            {lessons[0] && (
                                <PrimaryButton href={`/watch/${domain}/${course.id}?lesson=${lessons[0].id}`} leadingIcon={<Play size={16} />}>
                                    شروع
                                </PrimaryButton>
                            )}
                            <LikeButton targetType="course" targetId={course.id} initialCount={course.likes_count || 0} />
                        </div>
                    </div>
                </section>

                <section className="rounded-[24px] border border-[#dfe6f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                    <h3 className="text-base font-black text-slate-950">معرفی</h3>
                    <p className="mt-3 text-sm leading-8 text-slate-600" {...synopsisProps}>{synopsis}</p>
                </section>

                <section className="rounded-[24px] border border-[#dfe6f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-black text-slate-950">درس‌ها</h3>
                    </div>

                    {sections.length === 0 ? (
                        <StateCard text="هنوز ویدیویی برای این محتوا ثبت نشده است." />
                    ) : (
                        sections.map((section, sectionIndex) => {
                            const sectionSummary = getMetaString(section.metadata_json, "summary", "");
                            const sectionBadge = getMetaString(section.metadata_json, "badge", "");
                            const sectionNotes: string[] = [];
                            const sectionLessons = section.lessons || [];

                            return (
                                <div key={section.id} className="mt-3">
                                    <div className="hidden">
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-slate-950" {...getDirectionalTextProps(section.title)}>{section.title || `بخش ${sectionIndex + 1}`}</h4>
                                            {sectionSummary && <p className="mt-1 text-xs leading-6 text-slate-500" {...getDirectionalTextProps(sectionSummary)}>{sectionSummary}</p>}
                                        </div>
                                        {sectionBadge && (
                                            <span className="shrink-0 rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6]" {...getDirectionalTextProps(sectionBadge)}>
                                                {sectionBadge}
                                            </span>
                                        )}
                                    </div>

                                    {sectionNotes.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {sectionNotes.map((note) => (
                                                <span key={note} className="rounded-full border border-[#dfe6f0] bg-white px-3 py-1 text-[11px] font-bold text-slate-500" {...getDirectionalTextProps(note)}>
                                                    {note}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="motion-list space-y-2.5">
                                        {sectionLessons.map((lesson, index) => {
                                            const lessonSummary = getMetaString(lesson.metadata_json, "summary", "");
                                            const lessonSubtitle = getMetaString(lesson.metadata_json, "subtitle", "");
                                            const durationLabel = getMetaString(
                                                lesson.metadata_json,
                                                "duration_label",
                                                lesson.duration_minutes ? `${lesson.duration_minutes} دقیقه` : "",
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
                                                    badge={lesson.is_free ? "رایگان" : undefined}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </section>
            </main>
        </div>
    );
}

function StateCard({ text }: { text: string }) {
    return (
        <div className="rounded-[22px] border border-[#dfe6f0] bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            {text}
        </div>
    );
}
