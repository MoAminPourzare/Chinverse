"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bookmark, MoreVertical, Star } from "lucide-react";
import { BackButton } from "@/components/ui/IconButton";
import CourseDetailPage from "@/components/course/CourseDetailPage";
import { getReturnToHref } from "@/lib/returnTo";
import { getHskCourse, getHskLessonTitle } from "@/lib/hskCatalog";

export default function HSKCourseDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const course = getHskCourse(params?.id);

    if (!course && /^\d+$/.test(params?.id || "")) {
        return (
            <CourseDetailPage
                domain="hsk"
                explorePath="/explore/hsk"
                eyebrow="HSK"
                countKeys={["lesson_count"]}
                countLabel="درس"
                accentClass="bg-blue-600"
            />
        );
    }

    if (!course) {
        return (
            <div className="min-h-full bg-[#f7f8fa] px-4 py-6 dark:bg-[#10151c]" dir="rtl">
                <div className="mx-auto flex min-h-[55vh] max-w-[430px] flex-col items-center justify-center rounded-[24px] border border-[#dfe6f0] bg-white p-8 text-center dark:border-slate-700 dark:bg-[#18212b]">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">این سطح پیدا نشد</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">از فهرست HSK یکی از دوره‌های موجود را انتخاب کن.</p>
                    <Link href="/explore/hsk" className="mt-6 rounded-[16px] bg-[#155aa6] px-5 py-3 text-sm font-black text-white">
                        بازگشت به HSK
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto w-full max-w-[430px] px-4 py-4">
                <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between bg-[#f7f8fa]/92 px-4 py-2 backdrop-blur dark:bg-[#10151c]/92" dir="ltr">
                    <BackButton href="/explore/hsk" label="بازگشت به فهرست HSK" />
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled
                            title="ذخیره‌کردن پس از اتصال دوره به دیتابیس فعال می‌شود"
                            aria-label="ذخیره‌کردن این دوره هنوز فعال نیست"
                            className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full text-[#333941] opacity-70 dark:text-slate-100"
                        >
                            <Bookmark size={23} />
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

                <section className="mt-3 grid grid-cols-[1fr_46%] items-center gap-5" dir="ltr">
                    <div className="min-w-0 text-center" dir="rtl">
                        <h1 className="text-[22px] font-black leading-8 text-[#343941] dark:text-white" dir="ltr">{course.title}</h1>
                        <p className="mt-1 text-[11px] font-medium leading-5 text-[#59616c] dark:text-slate-300">یادگیری زبان چینی، آسان و مرحله‌به‌مرحله</p>
                        <div className="mt-2 flex items-center justify-center gap-1 text-[#ffb321]" dir="ltr" aria-label={`${course.rating} ستاره از ۵ ستاره`}>
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star key={index} size={19} className={index < course.rating ? "fill-current" : "text-[#aeb5be]"} />
                            ))}
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-[#2675cf]">ثبت نظر پس از ورود به حساب فعال می‌شود</p>
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-[10px] bg-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                        <Image
                            src={course.coverPath}
                            alt={`جلد دورهٔ ${course.title}`}
                            fill
                            sizes="190px"
                            className="object-cover"
                            priority
                        />
                    </div>
                </section>

                <section className="mt-5">
                    <h2 className="text-sm font-black text-[#343941] dark:text-white">معرفی دوره:</h2>
                    <p className="mt-2 text-justify text-[12px] font-medium leading-7 text-[#40464f] dark:text-slate-300">{course.description}</p>
                </section>

                <section className="mt-4">
                    <h2 className="text-sm font-black text-[#343941] dark:text-white">سطح:</h2>
                    <ul className="mt-1 list-disc space-y-1 pr-5 text-[12px] font-medium leading-6 text-[#40464f] dark:text-slate-300">
                        <li>{course.levelLabel}</li>
                        {course.audience.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                </section>

                <section className="mt-5" aria-labelledby="hsk-lessons-heading">
                    <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                            <h2 id="hsk-lessons-heading" className="text-base font-black text-[#343941] dark:text-white">درس‌های دوره</h2>
                            <p className="mt-1 text-[11px] leading-5 text-[#737b87] dark:text-slate-400">ساختار درس‌ها آماده است؛ ویدیوهای اصلی بعداً از سرور متصل می‌شوند.</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#e8f2fd] px-2.5 py-1 text-[10px] font-black text-[#155aa6]">{course.lessonCount} درس</span>
                    </div>

                    <div className="motion-list space-y-2.5">
                        {Array.from({ length: course.lessonCount }, (_, index) => (
                            <Link
                                key={index}
                                href={`/hsk/${course.slug}/lesson/${index + 1}`}
                                className="group block rounded-[14px] bg-[#e3e7ed] p-2.5 transition hover:bg-[#dce7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#222c38] dark:hover:bg-[#293746]"
                                dir="ltr"
                            >
                                <article className="grid grid-cols-[1fr_34%] gap-3">
                                    <div className="min-w-0 py-1 text-left">
                                        <h3 className="truncate font-serif text-[18px] leading-7 text-[#2f343b] dark:text-white">{getHskLessonTitle(course, index)}</h3>
                                        <p className="mt-1 truncate text-[10px] font-medium text-[#717985] dark:text-slate-300" dir="rtl">ویدیوی این درس به‌زودی اضافه می‌شود</p>
                                        <div className="mt-5 h-[3px] overflow-hidden rounded-full bg-[#a9d6f7]">
                                            <div className="h-full w-[8%] rounded-full bg-[#155aa6]" />
                                        </div>
                                        <p className="mt-1 text-right text-[9px] font-medium text-[#777f89] dark:text-slate-400" dir="rtl">زمان ویدیو پس از بارگذاری مشخص می‌شود</p>
                                    </div>
                                    <div className="min-h-[86px] rounded-[10px] border border-white/70 bg-[linear-gradient(45deg,#f8f8f8_25%,transparent_25%),linear-gradient(-45deg,#f8f8f8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8f8f8_75%),linear-gradient(-45deg,transparent_75%,#f8f8f8_75%)] bg-[length:14px_14px] bg-[position:0_0,0_7px,7px_-7px,-7px_0px] group-hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:group-hover:bg-slate-700" aria-hidden />
                                </article>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
