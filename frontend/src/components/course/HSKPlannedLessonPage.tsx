"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock3, Play } from "lucide-react";
import { BackButton } from "@/components/ui/IconButton";
import { getHskCourse, getHskLessonTitle, getHskLessonTopic } from "@/lib/hskCatalog";
import { findPublishedHskLesson, getPublishedHskLessonHref } from "@/lib/hskPublished";
import { useHskPublishedCourse } from "@/lib/useHskPublishedCourse";

export default function HSKPlannedLessonPage() {
    const params = useParams<{ id: string; lesson: string }>();
    const course = getHskCourse(params?.id);
    const { publishedCourse, isLoading, hasError } = useHskPublishedCourse(course);
    const lessonIndex = Number(params?.lesson) - 1;
    const isValidLesson = course && Number.isInteger(lessonIndex) && lessonIndex >= 0 && lessonIndex < course.lessonCount;
    const publishedLesson = isValidLesson ? findPublishedHskLesson(publishedCourse, lessonIndex + 1) : undefined;

    if (!course || !isValidLesson) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa] p-5 dark:bg-[#10151c]" dir="rtl">
                <div className="rounded-[24px] border border-[#dfe6f0] bg-white p-8 text-center dark:border-slate-700 dark:bg-[#18212b]">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white">این درس پیدا نشد</h1>
                    <Link href="/explore/hsk" className="mt-5 inline-flex rounded-[14px] bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white">بازگشت به HSK</Link>
                </div>
            </div>
        );
    }

    const title = getHskLessonTitle(course, lessonIndex);
    const topic = getHskLessonTopic(course, lessonIndex);
    const previousIndex = lessonIndex > 0 ? lessonIndex : null;
    const nextIndex = lessonIndex + 1 < course.lessonCount ? lessonIndex + 2 : null;

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto w-full max-w-[430px] px-4 py-5">
                <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3" dir="ltr">
                    <BackButton href={`/hsk/${course.slug}`} label={`بازگشت به ${course.title}`} />
                    <div className="min-w-0 text-center" dir="rtl">
                        <p className="truncate text-[10px] font-black text-[#155aa6]" dir="ltr">{course.title}</p>
                        <h1 className="truncate text-sm font-black text-[#343941] dark:text-white" dir="ltr">{title}</h1>
                    </div>
                    <span aria-hidden />
                </header>

                <section className="mt-5 overflow-hidden rounded-[22px] bg-[#17202c] shadow-[0_18px_34px_rgba(15,23,42,0.20)]">
                    <div className="flex aspect-video flex-col items-center justify-center px-8 text-center text-white">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/20">
                            <Play size={25} className="mr-0.5 fill-current" />
                        </div>
                        <h2 className="mt-4 text-base font-black">{publishedLesson ? "ویدیوی این درس آماده است" : "جای ویدیوی درس آماده است"}</h2>
                        <p className="mt-2 text-[11px] leading-6 text-slate-300">{hasError ? "وضعیت ویدیو دریافت نشد؛ دوباره صفحه را باز کن." : isLoading ? "در حال بررسی ویدیوی منتشرشده…" : publishedLesson ? "برای تماشای ویدیو، پلیر درس را باز کن." : "فایل اصلی این درس هنوز منتشر نشده است."}</p>
                        {publishedCourse && publishedLesson && <Link href={getPublishedHskLessonHref(publishedCourse, publishedLesson)} className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-black text-[#155aa6]">تماشای ویدیو</Link>}
                    </div>
                </section>

                <section className="mt-4 rounded-[20px] border border-[#dfe6f0] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-[#18212b]">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-black text-[#155aa6]" dir="ltr">{course.title}</p>
                            <h2 className="mt-1 font-serif text-xl text-[#2f343b] dark:text-white" dir="ltr">{title}</h2>
                            {topic && <p className="mt-1 font-serif text-sm text-[#4b535e] dark:text-slate-200" lang="zh-Hans" dir="ltr">{topic}</p>}
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff6df] px-2.5 py-1 text-[10px] font-black text-[#9a6a00]">
                            <Clock3 size={12} />
                            {publishedLesson ? "آمادهٔ پخش" : hasError ? "نامشخص" : isLoading ? "در حال بررسی" : "به‌زودی"}
                        </span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-[#646d79] dark:text-slate-300">{publishedLesson ? "ویدیو و اطلاعات منتشرشدهٔ این درس در پلیر اصلی نمایش داده می‌شوند." : "عنوان و ترتیب این بخش ثبت شده است. پس از انتشار ویدیو، مدت و زیرنویس از دادهٔ واقعی نمایش داده می‌شوند."}</p>
                </section>

                <nav className="mt-4 grid grid-cols-2 gap-2" aria-label="جابجایی بین درس‌ها">
                    {previousIndex ? (
                        <Link href={`/hsk/${course.slug}/lesson/${previousIndex}`} className="rounded-[16px] border border-[#dfe6f0] bg-white px-3 py-3 text-center text-xs font-black text-[#59616c] dark:border-slate-700 dark:bg-[#18212b] dark:text-slate-200">درس قبلی</Link>
                    ) : (
                        <span className="rounded-[16px] border border-[#dfe6f0] bg-slate-50 px-3 py-3 text-center text-xs font-black text-slate-300">درس قبلی</span>
                    )}
                    {nextIndex ? (
                        <Link href={`/hsk/${course.slug}/lesson/${nextIndex}`} className="rounded-[16px] bg-[#155aa6] px-3 py-3 text-center text-xs font-black text-white">درس بعدی</Link>
                    ) : (
                        <span className="rounded-[16px] bg-slate-100 px-3 py-3 text-center text-xs font-black text-slate-400">پایان دوره</span>
                    )}
                </nav>
            </main>
        </div>
    );
}
