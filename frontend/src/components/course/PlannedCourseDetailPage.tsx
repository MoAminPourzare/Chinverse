"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2, MoreVertical } from "lucide-react";
import { BackButton } from "@/components/ui/IconButton";
import CourseDetailPage from "@/components/course/CourseDetailPage";
import { checkCourseSaved, saveCourse, unsaveCourse } from "@/lib/courses";
import { getReturnToHref } from "@/lib/returnTo";
import { getPlannedCourse, getPlannedLessonTitle, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { findPublishedPlannedLesson, getPublishedPlannedLessonHref } from "@/lib/plannedCoursePublished";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

interface PlannedCourseDetailPageProps {
    domain: string;
    title: string;
    basePath: string;
    catalog: PlannedCatalogCourse[];
    countLabel?: string;
    unitPlural?: string;
    descriptionHeading?: string;
    listHeading?: string;
    eyebrow?: string;
}

export default function PlannedCourseDetailPage({
    domain,
    title,
    basePath,
    catalog,
    countLabel = "درس",
    unitPlural = "درس‌های",
    descriptionHeading = "معرفی دوره:",
    listHeading = "درس‌های دوره",
    eyebrow,
}: PlannedCourseDetailPageProps) {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const course = getPlannedCourse(catalog, params?.id);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse(domain, course);
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

    if (!course && /^\d+$/.test(params?.id || "")) {
        return <CourseDetailPage domain={domain} explorePath={`/explore/${domain}`} eyebrow={title} countKeys={["lesson_count"]} countLabel={countLabel} />;
    }

    if (!course) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa] p-5 dark:bg-[#10151c]" dir="rtl">
                <div className="rounded-[24px] border border-[#dfe6f0] bg-white p-8 text-center dark:border-slate-700 dark:bg-[#18212b]">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white">این دوره پیدا نشد</h1>
                    <Link href={`/explore/${domain}`} className="mt-5 inline-flex rounded-[14px] bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white">بازگشت به {title}</Link>
                </div>
            </div>
        );
    }

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
            <main className="mx-auto w-full max-w-[430px] px-4 py-4">
                <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between bg-[#f7f8fa]/92 px-4 py-2 backdrop-blur dark:bg-[#10151c]/92" dir="ltr">
                    <BackButton href={`/explore/${domain}`} label={`بازگشت به فهرست ${title}`} />
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleToggleSaved}
                            disabled={!publishedCourse || savingBookmark}
                            aria-label={publishedCourse ? (isSaved ? "حذف از منتخب‌ها" : "ذخیره در منتخب‌ها") : "ذخیره‌سازی پس از انتشار فعال می‌شود"}
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${isSaved ? "bg-[#155aa6] text-white" : "text-[#333941] hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800"} disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                            {savingBookmark ? <Loader2 size={21} className="animate-spin" /> : isSaved ? <BookmarkCheck size={21} /> : <Bookmark size={21} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(getReturnToHref("/settings/appearance"))}
                            aria-label="تنظیمات نمایش درس"
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#333941] transition hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <MoreVertical size={22} />
                        </button>
                    </div>
                </header>

                <section className="mt-3 grid grid-cols-[1fr_46%] items-center gap-3" dir="ltr">
                    <div className="min-w-0 text-center" dir="ltr">
                        <h1 className="text-[17px] font-black leading-7 text-[#343941] dark:text-white">{course.title}</h1>
                        {course.subtitle && <p className="mt-0.5 text-[12px] font-medium leading-5 text-[#40464f] dark:text-slate-300">{course.subtitle}</p>}
                        <p className="mt-2 text-[11px] font-medium leading-5 text-[#59616c] dark:text-slate-300" dir="rtl">{eyebrow || `یادگیری زبان چینی | ${title}`}</p>
                        <p className="mt-2 text-[10px] font-bold text-[#667587] dark:text-slate-300" dir="rtl">امتیازدهی فعلاً فعال نیست</p>
                    </div>
                    <div className={`relative overflow-hidden rounded-[10px] bg-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${course.detailImageAspect === "video" ? "aspect-video" : "aspect-square"}`}>
                        <Image src={course.detailCoverPath || course.coverPath} alt={`تصویر دورهٔ ${course.title}`} fill sizes="190px" className="object-cover" priority />
                    </div>
                </section>

                <section className="mt-5">
                    <h2 className="text-sm font-black text-[#343941] dark:text-white">{course.introductionHeading || descriptionHeading}</h2>
                    {course.description.map((paragraph) => (
                        <p key={paragraph} className="mt-2 text-right text-[12px] font-medium leading-7 text-[#40464f] dark:text-slate-300">{paragraph}</p>
                    ))}
                </section>

                <section className="mt-4">
                    <h2 className="text-sm font-black text-[#343941] dark:text-white">سطح:</h2>
                    <ul className="mt-1 list-disc space-y-1 pr-5 text-[12px] font-medium leading-6 text-[#40464f] dark:text-slate-300">
                        {course.audience.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                </section>

                <section className="mt-5" aria-labelledby="planned-lessons-heading">
                    <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                            <h2 id="planned-lessons-heading" className="text-base font-black text-[#343941] dark:text-white">{listHeading}</h2>
                            <p className="mt-1 text-[11px] leading-5 text-[#737b87] dark:text-slate-400">
                                {hasError ? "وضعیت ویدیوها دریافت نشد؛ دوباره صفحه را باز کن." : isLoading ? `در حال بررسی ${unitPlural} منتشرشده…` : `${unitPlural} آماده به پلیر وصل‌اند؛ بقیه در دست آماده‌سازی‌اند.`}
                            </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#e8f2fd] px-2.5 py-1 text-[10px] font-black text-[#155aa6]">{course.lessonCount} {countLabel} در برنامه</span>
                    </div>

                    <div className="motion-list space-y-2.5">
                        {Array.from({ length: course.lessonCount }, (_, index) => {
                            const position = index + 1;
                            const publishedLesson = findPublishedPlannedLesson(publishedCourse, position);
                            const href = publishedCourse && publishedLesson
                                ? getPublishedPlannedLessonHref(domain, publishedCourse, publishedLesson)
                                : `${basePath}/${course.slug}/lesson/${position}`;
                            const subtitle = publishedLesson?.title || course.knownLessonSubtitles[position];
                            const thumbnail = course.knownLessonThumbnails?.[position];
                            return (
                                <Link key={position} href={href} className="group block rounded-[14px] bg-[#e3e7ed] p-2.5 transition hover:bg-[#dce7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#222c38] dark:hover:bg-[#293746]" dir="ltr">
                                    <article className="grid grid-cols-[1fr_34%] gap-3">
                                        <div className="min-w-0 py-1 text-left">
                                            <h3 className="font-serif text-[18px] leading-7 text-[#2f343b] dark:text-white">{getPlannedLessonTitle(course, position)}</h3>
                                            {subtitle && <p className="mt-1 line-clamp-2 text-[10px] font-bold leading-4 text-[#40464f] dark:text-slate-200">{subtitle}</p>}
                                            <p className="mt-3 text-[10px] font-medium text-[#717985] dark:text-slate-300" dir="rtl">
                                                {publishedLesson ? "ویدیو آمادهٔ پخش است" : hasError ? "وضعیت ویدیو نامشخص است" : isLoading ? "در حال بررسی ویدیو…" : `ویدیوی این ${countLabel} هنوز منتشر نشده است`}
                                            </p>
                                        </div>
                                        <div className="relative min-h-[86px] overflow-hidden rounded-[10px] bg-[#f3f5f8] dark:bg-slate-700">
                                            {thumbnail ? <Image src={thumbnail} alt={`تصویر درس ${position} از ${course.title}`} fill sizes="130px" className="object-cover" /> : <span className="absolute inset-0 bg-[linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] bg-[length:14px_14px] bg-[position:0_0,0_7px,7px_-7px,-7px_0px] opacity-80 dark:opacity-10" aria-hidden />}
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {course.practiceCount && (
                    <section className="mt-6 rounded-[16px] border border-[#dfe6f0] bg-white p-4 dark:border-slate-700 dark:bg-[#18212b]">
                        <h2 className="text-sm font-black text-[#343941] dark:text-white">تمرین‌ها</h2>
                        <p className="mt-1 text-xs leading-6 text-[#646d79] dark:text-slate-300">{course.practiceCount} تمرین برای این دوره در برنامه است؛ محتوای آن‌ها هنوز آمادهٔ نمایش نیست.</p>
                    </section>
                )}
            </main>
        </div>
    );
}
