import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/IconButton";
import type { PlannedCatalogCourse } from "@/lib/plannedCourseCatalog";

interface PlannedCourseExplorePageProps {
    title: string;
    basePath: string;
    catalog: PlannedCatalogCourse[];
    compactTitle?: boolean;
    countLabel?: string;
    headingSubtitle?: string;
}

export default function PlannedCourseExplorePage({ title, basePath, catalog, compactTitle = false, countLabel = "درس", headingSubtitle }: PlannedCourseExplorePageProps) {
    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-5 px-4 py-5">
                <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3" dir="ltr">
                    <BackButton href="/explore" label="بازگشت به کاوش" />
                    <div className="min-w-0 text-center" dir="rtl">
                        <h1 className={`font-black text-[#25272d] dark:text-white ${compactTitle ? "whitespace-nowrap text-[15px]" : "text-[22px]"}`}>{title}</h1>
                        {headingSubtitle && <p className="mt-0.5 text-[18px] font-black leading-5 text-[#25272d] dark:text-white">{headingSubtitle}</p>}
                    </div>
                    <span aria-hidden />
                </header>

                <div className="motion-list grid grid-cols-3 gap-2.5" dir="ltr">
                    {catalog.map((course) => (
                        <Link
                            key={course.slug}
                            href={`${basePath}/${course.slug}`}
                            className="group min-w-0 overflow-hidden rounded-[14px] bg-[#e3e7ed] pb-2.5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#222c38]"
                        >
                            <div className="relative aspect-square overflow-hidden rounded-[13px] bg-slate-200">
                                <Image
                                    src={course.coverPath}
                                    alt={`تصویر دورهٔ ${course.title}${course.cardSubtitle ? ` ${course.cardSubtitle}` : ""}`}
                                    fill
                                    sizes="(max-width: 430px) 31vw, 125px"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                            <div className="px-1.5 pt-1.5 text-left">
                                <h2 className={`${course.cardSubtitle ? "line-clamp-1 min-h-4" : "line-clamp-2 min-h-8"} text-[9px] font-bold leading-4 text-[#343941] dark:text-white`}>{course.cardTitle || course.title}</h2>
                                {course.cardSubtitle && <p className="line-clamp-2 min-h-8 text-[8px] font-bold leading-4 text-[#343941] dark:text-slate-100">{course.cardSubtitle}</p>}
                                <p className="mt-1 text-[9px] font-medium text-[#737b87] dark:text-slate-400" dir="rtl">
                                    {course.countSummary || (course.chapterCount ? `${course.chapterCount} درس · ${course.lessonCount} بخش` : `${course.lessonCount} ${countLabel}${course.practiceCount ? ` + ${course.practiceCount} تمرین` : ""} در برنامه`)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
