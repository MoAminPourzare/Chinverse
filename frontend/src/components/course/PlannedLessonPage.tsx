"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock3, Play } from "lucide-react";
import { BackButton } from "@/components/ui/IconButton";
import { getPlannedCourse, getPlannedItemCount, getPlannedLessonTitle, type PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";
import { findPublishedPlannedLesson, getPublishedPlannedLessonHref } from "@/lib/plannedCoursePublished";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";
import { getPublishedSeriesEpisode } from "@/lib/screenMediaCatalog";

interface PlannedLessonPageProps {
    domain: string;
    title: string;
    basePath: string;
    catalog: PlannedCatalogCourse[];
    unitLabel?: string;
    unitPlural?: string;
    requirePublishedMedia?: boolean;
}

export default function PlannedLessonPage({
    domain,
    title: categoryTitle,
    basePath,
    catalog,
    unitLabel = "درس",
    unitPlural = "درس‌ها",
    requirePublishedMedia = false,
}: PlannedLessonPageProps) {
    const params = useParams<{ id: string; lesson: string }>();
    const course = getPlannedCourse(catalog, params?.id);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse(domain, course);
    const position = Number(params?.lesson);
    const isValidLesson = course && Number.isInteger(position) && position >= 1 && position <= getPlannedItemCount(course);
    const groupLessonCount = isValidLesson ? course.lessonGroupCounts?.[position] : undefined;
    const publishedLesson = isValidLesson && !groupLessonCount
        ? requirePublishedMedia ? getPublishedSeriesEpisode(publishedCourse, position) : findPublishedPlannedLesson(publishedCourse, position)
        : undefined;

    if (!course || !isValidLesson) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa] p-5 dark:bg-[#10151c]" dir="rtl">
                <div className="rounded-[24px] border border-[#dfe6f0] bg-white p-8 text-center dark:border-slate-700 dark:bg-[#18212b]">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white">این {unitLabel} پیدا نشد</h1>
                    <Link href={`/explore/${domain}`} className="mt-5 inline-flex rounded-[14px] bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white">بازگشت به {categoryTitle}</Link>
                </div>
            </div>
        );
    }

    const title = getPlannedLessonTitle(course, position);
    const subtitle = publishedLesson?.title || course.knownLessonSubtitles[position];
    const itemLabel = position > course.lessonCount ? "تمرین" : unitLabel;

    if (groupLessonCount) {
        return (
            <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
                <main className="mx-auto w-full max-w-[430px] px-4 py-5">
                    <header className="flex items-center justify-between" dir="ltr">
                        <BackButton href={`${basePath}/${course.slug}`} label={`بازگشت به ${course.title}`} />
                        <span className="text-xs font-black text-[#155aa6]">{course.title}</span>
                    </header>
                    <section className="mt-6 rounded-[20px] border border-[#dfe6f0] bg-white p-5 dark:border-slate-700 dark:bg-[#18212b]">
                        <p className="text-xs font-bold text-[#155aa6]">مجموعهٔ گرامر</p>
                        <h1 className="mt-2 text-xl font-black text-[#343941] dark:text-white" dir="ltr">{title}</h1>
                        <p className="mt-2 text-sm font-bold text-[#59616c] dark:text-slate-300">{groupLessonCount} درس</p>
                        <p className="mt-4 text-xs leading-7 text-[#646d79] dark:text-slate-300">تعداد درس‌های این سطح ثبت شده است. عنوان‌ها و ویدیوهای هر درس هنوز در اطلاعات دریافتی موجود نیستند.</p>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto w-full max-w-[430px] px-4 py-5">
                <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3" dir="ltr">
                    <BackButton href={`${basePath}/${course.slug}`} label={`بازگشت به ${course.title}`} />
                    <div className="min-w-0 text-center" dir="ltr">
                        <p className="truncate text-[10px] font-black text-[#155aa6]">{course.title}</p>
                        <h1 className="truncate text-sm font-black text-[#343941] dark:text-white">{title}</h1>
                    </div>
                    <span aria-hidden />
                </header>

                <section className="mt-5 overflow-hidden rounded-[22px] bg-[#17202c] shadow-[0_18px_34px_rgba(15,23,42,0.20)]">
                    <div className="flex aspect-video flex-col items-center justify-center px-8 text-center text-white">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/20">
                            <Play size={25} className="mr-0.5 fill-current" />
                        </div>
                        <h2 className="mt-4 text-base font-black">{publishedLesson ? `ویدیوی این ${itemLabel} آماده است` : `جای ویدیوی ${itemLabel} آماده است`}</h2>
                        <p className="mt-2 text-[11px] leading-6 text-slate-300">
                            {hasError ? "وضعیت ویدیو دریافت نشد؛ دوباره صفحه را باز کن." : isLoading ? "در حال بررسی ویدیوی منتشرشده…" : publishedLesson ? `برای تماشا، پلیر ${itemLabel} را باز کن.` : `فایل اصلی این ${itemLabel} هنوز منتشر نشده است.`}
                        </p>
                        {publishedCourse && publishedLesson && <Link href={getPublishedPlannedLessonHref(domain, publishedCourse, publishedLesson)} className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-black text-[#155aa6]">تماشای ویدیو</Link>}
                    </div>
                </section>

                <section className="mt-4 rounded-[20px] border border-[#dfe6f0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-[#18212b]">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0" dir="ltr">
                            <p className="text-[11px] font-black text-[#155aa6]">{course.title}</p>
                            <h2 className="mt-1 font-serif text-xl text-[#2f343b] dark:text-white">{title}</h2>
                            {subtitle && <p className="mt-1 text-xs font-bold text-[#59616c] dark:text-slate-300">{subtitle}</p>}
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff6df] px-2.5 py-1 text-[10px] font-black text-[#9a6a00]">
                            <Clock3 size={12} />
                            {publishedLesson ? "آمادهٔ پخش" : hasError ? "نامشخص" : isLoading ? "در حال بررسی" : "به‌زودی"}
                        </span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-[#646d79] dark:text-slate-300">
                        {publishedLesson ? `ویدیو و اطلاعات منتشرشدهٔ این ${itemLabel} در پلیر اصلی نمایش داده می‌شوند.` : `عنوان و جایگاه ${itemLabel} آماده شده‌اند. پس از انتشار ویدیو، مدت و زیرنویس از دادهٔ واقعی نمایش داده می‌شوند.`}
                    </p>
                </section>

                <nav className="mt-4 grid grid-cols-2 gap-2" aria-label={`جابجایی بین ${unitPlural}`}>
                    {position > 1 ? <Link href={`${basePath}/${course.slug}/lesson/${position - 1}`} className="rounded-[16px] border border-[#dfe6f0] bg-white px-3 py-3 text-center text-xs font-black text-[#59616c] dark:border-slate-700 dark:bg-[#18212b] dark:text-slate-200">{position - 1 > course.lessonCount ? "تمرین" : unitLabel} قبلی</Link> : <span className="rounded-[16px] border border-[#dfe6f0] bg-slate-50 px-3 py-3 text-center text-xs font-black text-slate-300">{unitLabel} قبلی</span>}
                    {position < getPlannedItemCount(course) ? <Link href={`${basePath}/${course.slug}/lesson/${position + 1}`} className="rounded-[16px] bg-[#155aa6] px-3 py-3 text-center text-xs font-black text-white">{position + 1 > course.lessonCount ? "تمرین" : unitLabel} بعدی</Link> : <span className="rounded-[16px] bg-slate-100 px-3 py-3 text-center text-xs font-black text-slate-400">پایان مجموعه</span>}
                </nav>
            </main>
        </div>
    );
}
