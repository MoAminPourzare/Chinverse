"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2, MoreVertical, Star } from "lucide-react";
import CourseDetailPage from "@/components/course/CourseDetailPage";
import { BackButton } from "@/components/ui/IconButton";
import { checkCourseSaved, saveCourse, unsaveCourse } from "@/lib/courses";
import { getCalligraphyCourse } from "@/lib/calligraphyCatalog";
import { getPlannedLessonTitle } from "@/lib/plannedCourseCatalog";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";
import { getPublishedCalligraphyLevelLesson } from "@/lib/calligraphyPublished";
import { getReturnToHref } from "@/lib/returnTo";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

export default function CalligraphyDetailPage() {
    const params = useParams<{ id: string; level?: string }>();
    const router = useRouter();
    const course = getCalligraphyCourse(params?.id);
    const level = course?.levels?.find((item) => item.slug === params?.level);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse("calligraphy", course);
    const [isSaved, setIsSaved] = useState(false);
    const [savingBookmark, setSavingBookmark] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (!publishedCourse?.id) {
            setIsSaved(false);
            return;
        }
        checkCourseSaved(publishedCourse.id)
            .then((saved) => { if (!cancelled) setIsSaved(saved); })
            .catch(() => { if (!cancelled) setIsSaved(false); });
        return () => { cancelled = true; };
    }, [publishedCourse?.id]);

    if (!course && !params?.level && /^\d+$/.test(params?.id || "")) {
        return <CourseDetailPage domain="calligraphy" explorePath="/explore/calligraphy" eyebrow="هنر و مهارت‌های چینی" countKeys={["lesson_count", "episodes_count"]} countLabel="درس" />;
    }

    if (!course) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa] p-5 dark:bg-[#10151c]" dir="rtl">
                <div className="rounded-[24px] border border-[#dfe6f0] bg-white p-8 text-center dark:border-slate-700 dark:bg-[#18212b]">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white">این مجموعه پیدا نشد</h1>
                    <Link href="/explore/calligraphy" className="mt-5 inline-flex rounded-[14px] bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white">بازگشت به خطاطی</Link>
                </div>
            </div>
        );
    }

    if (params?.level && !level) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa] p-5 dark:bg-[#10151c]" dir="rtl">
                <div className="rounded-[24px] border border-[#dfe6f0] bg-white p-8 text-center dark:border-slate-700 dark:bg-[#18212b]">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white">این سطح پیدا نشد</h1>
                    <Link href={`/calligraphy/${course.slug}`} className="mt-5 inline-flex rounded-[14px] bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white">بازگشت به دوره</Link>
                </div>
            </div>
        );
    }

    const showingLevels = Boolean(course.levels && !level);

    const handleToggleSaved = async () => {
        if (!publishedCourse || savingBookmark) return;
        setSavingBookmark(true);
        try {
            if (isSaved) {
                await unsaveCourse(publishedCourse.id);
                setIsSaved(false);
            } else {
                await saveCourse(publishedCourse.id);
                setIsSaved(true);
            }
        } catch {
            alert("برای ذخیره کردن این مجموعه باید وارد حساب کاربری شوی.");
        } finally {
            setSavingBookmark(false);
        }
    };

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto w-full max-w-[430px] px-6 py-4">
                <div className="sticky top-0 z-10 -mx-6 bg-[#f7f8fa] px-6 pb-5 dark:bg-[#10151c]">
                    <header className="-mx-2 flex items-center justify-between py-2" dir="ltr">
                        <BackButton href={level ? `/calligraphy/${course.slug}` : "/explore/calligraphy"} label={level ? "بازگشت به دوره" : "بازگشت به فهرست خطاطی"} />
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={handleToggleSaved} disabled={!publishedCourse || savingBookmark}
                                aria-label={publishedCourse ? (isSaved ? "حذف از منتخب‌ها" : "ذخیره در منتخب‌ها") : "ذخیره‌سازی پس از انتشار فعال می‌شود"}
                                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${isSaved ? "bg-[#155aa6] text-white" : "text-[#333941] hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800"} disabled:cursor-not-allowed disabled:opacity-70`}>
                                {savingBookmark ? <Loader2 size={21} className="animate-spin" /> : isSaved ? <BookmarkCheck size={21} /> : <Bookmark size={21} />}
                            </button>
                            <button type="button" onClick={() => router.push(getReturnToHref("/settings/appearance"))} aria-label="تنظیمات نمایش" className="flex h-10 w-10 items-center justify-center rounded-full text-[#333941] transition hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800">
                                <MoreVertical size={22} />
                            </button>
                        </div>
                    </header>
                    <section className="mt-4 grid grid-cols-2 items-center gap-2" dir="ltr">
                        <div className="min-w-0 text-center">
                            <h1 className="text-[15px] font-bold leading-6 text-[#343941] dark:text-white" lang="zh">{course.cardTitle || course.title}</h1>
                            {course.subtitle && <p className="mt-0.5 text-[14px] font-bold leading-5 text-[#343941] dark:text-white" lang="zh">{course.subtitle}</p>}
                            <p className="mt-2 text-[10px] leading-5 text-[#59616c] dark:text-slate-300" dir="rtl">هنر و مهارت‌های چینی</p>
                            <div className="mt-2 flex justify-center gap-1" aria-hidden="true">
                                {Array.from({ length: 5 }, (_, index) => <Star key={index} size={19} className={index < 4 ? "fill-[#f3ac25] text-[#f3ac25]" : "text-[#9ba4af]"} />)}
                            </div>
                            <button type="button" disabled aria-label="ثبت نظر پس از انتشار فعال می‌شود" className="mt-1.5 text-[10px] text-[#1768d4] disabled:cursor-not-allowed">ثبت نظر</button>
                        </div>
                        <div className="relative aspect-square w-full overflow-hidden rounded-[10px] bg-slate-200">
                            <Image src={course.coverPath} alt={`کاور ${course.title}`} fill sizes="(max-width: 430px) 43vw, 187px" className="object-cover" priority />
                        </div>
                    </section>
                </div>

                {showingLevels && <section className="mt-3 space-y-2 text-[12px] leading-7 text-[#343941] dark:text-slate-100" aria-label="معرفی دوره">
                    {course.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>}
                {level && <section className="mt-4 text-[#343941] dark:text-slate-100">
                    <h2 className="font-cjk text-[18px] leading-7" dir="ltr" lang="zh">{level.title}</h2>
                    <p className="mt-1 text-xs">{level.lessonCount} درس</p>
                </section>}
                <section className="mt-5 space-y-2" aria-label={showingLevels ? "سطح‌های دوره" : `درس‌های ${course.title}`}>
                    {showingLevels ? course.levels?.map((itemLevel) => {
                        const readyCount = Array.from({ length: itemLevel.lessonCount }, (_, index) => getPublishedCalligraphyLevelLesson(publishedCourse, itemLevel, index + 1)).filter(Boolean).length;
                        const status = hasError ? "وضعیت پخش نامشخص است" : isLoading ? "در حال بررسی درس‌ها…" : readyCount ? `${readyCount} درس آمادهٔ پخش` : "هنوز منتشر نشده";
                        return <Link key={itemLevel.slug} href={`/calligraphy/${course.slug}/level/${itemLevel.slug}`} className="block overflow-hidden rounded-[10px] bg-[#e2e5eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#202b3a]" dir="ltr" aria-label={`${itemLevel.title}: ${itemLevel.lessonCount} درس`}>
                            <article className="grid min-h-32 grid-cols-[1fr_40%] gap-2">
                                <div className="flex min-w-0 flex-col px-2.5 py-3 text-left">
                                    <h2 className="font-cjk text-[18px] leading-7 text-[#353941] dark:text-white" lang="zh">{itemLevel.title}</h2>
                                    <p className="mt-1 font-cjk text-[12px] leading-[17px] text-[#737b87] dark:text-slate-300" lang="zh">{itemLevel.lessonCount}课</p>
                                    <div className="mt-auto pt-2" dir="rtl">
                                        <div className="h-[3px] rounded-full bg-[#a8d6ff]" aria-hidden="true" />
                                        <p className="mt-1 text-[10px] leading-4 text-[#58616d] dark:text-slate-300">{status}</p>
                                    </div>
                                </div>
                                <div className="my-1.5 mr-1.5 rounded-[8px] bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] bg-[length:14px_14px] dark:bg-[conic-gradient(#334155_25%,#273344_0_50%,#334155_0_75%,#273344_0)]" role="img" aria-label="تصویر سطح هنوز اضافه نشده" />
                            </article>
                        </Link>;
                    }) : Array.from({ length: level?.lessonCount || course.lessonCount }, (_, index) => {
                        const position = index + 1;
                        const label = level ? `第${position}课` : getPlannedLessonTitle(course, position);
                        const lesson = level ? getPublishedCalligraphyLevelLesson(publishedCourse, level, position) : getPublishedSeriesEpisode(publishedCourse, position);
                        const topic = level ? lesson?.title : course.knownLessonSubtitles[position];
                        const href = publishedCourse && lesson ? `/watch/calligraphy/${publishedCourse.id}?lesson=${lesson.id}` : undefined;
                        const status = hasError ? "وضعیت پخش نامشخص است" : isLoading ? "در حال بررسی درس…" : href ? "آمادهٔ پخش" : "هنوز منتشر نشده";
                        const content = (
                            <article className="grid min-h-32 grid-cols-[1fr_40%] gap-2">
                                <div className="flex min-w-0 flex-col px-2.5 py-3 text-left">
                                    <h2 className="font-cjk text-[18px] leading-7 text-[#353941] dark:text-white" lang="zh">{label}</h2>
                                    {topic && <p className="mt-1 break-words font-cjk text-[12px] leading-[17px] text-[#343941] dark:text-slate-100" lang="zh">{topic}</p>}
                                    <div className="mt-auto pt-2" dir="rtl">
                                        <div className="h-[3px] rounded-full bg-[#a8d6ff]" aria-hidden="true" />
                                        <p className="mt-1 text-[10px] leading-4 text-[#58616d] dark:text-slate-300">{status}</p>
                                    </div>
                                </div>
                                <div className="my-1.5 mr-1.5 rounded-[8px] bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] bg-[length:14px_14px] dark:bg-[conic-gradient(#334155_25%,#273344_0_50%,#334155_0_75%,#273344_0)]" role="img" aria-label="تصویر درس هنوز اضافه نشده" />
                            </article>
                        );
                        return href ? <Link key={position} href={href} className="block overflow-hidden rounded-[10px] bg-[#e2e5eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#202b3a]" dir="ltr" aria-label={`پخش ${label}${topic ? `: ${topic}` : ""}`}>{content}</Link>
                            : <div key={position} className="overflow-hidden rounded-[10px] bg-[#e2e5eb] dark:bg-[#202b3a]" dir="ltr">{content}</div>;
                    })}
                </section>

                <details className="mt-5 rounded-[14px] bg-white p-4 text-[#343941] dark:bg-[#18212b] dark:text-slate-100">
                    <summary className="cursor-pointer text-sm font-bold">{showingLevels ? "این دوره مناسب چه کسی است؟" : "معرفی و سطح مجموعه"}</summary>
                    {!showingLevels && course.description.map((paragraph) => <p key={paragraph} className="mt-3 text-[12px] leading-7">{paragraph}</p>)}
                    <ul className="mt-3 list-disc space-y-1 pr-5 text-[12px] leading-6">{course.audience.map((item) => <li key={item}>{item}</li>)}</ul>
                </details>
            </main>
        </div>
    );
}
