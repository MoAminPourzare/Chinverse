"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Star } from "lucide-react";
import {
    Course,
    fetchCoursesBySubcategory,
    getCourseMetaNumber,
    getDisplayCount,
} from "@/lib/courses";
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps, getTextAlign } from "@/lib/textDirection";
import { BackButton } from "@/components/ui/IconButton";

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

const labelsBySlug: Record<string, string> = {
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
const getCourseHref = (detailPath: string, course: Course) => `${detailPath}/${course.id}`;

export default function CourseExplorePage({
    title,
    subcategorySlug,
    detailPath,
    layout,
    countLabel = "قسمت",
    countKeys = ["episodes_count"],
}: CourseExplorePageProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const displayTitle = labelsBySlug[subcategorySlug] || (isBrokenText(title) ? "دوره‌ها" : title);
    const displayCountLabel = isBrokenText(countLabel) ? (layout === "list" || subcategorySlug === "hsk" ? "درس" : "قسمت") : countLabel;

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
        if (layout !== "hsk") return courses;

        return [...courses].sort((a, b) => {
            const aLevel = getCourseMetaNumber(a, "hsk_level", Number(a.level) || a.id);
            const bLevel = getCourseMetaNumber(b, "hsk_level", Number(b.level) || b.id);
            return aLevel - bLevel;
        });
    }, [courses, layout]);

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 py-5">
                <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
                    <BackButton href="/explore" label="بازگشت به کاوش" className="justify-self-end" />
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-center text-[20px] font-black text-[#25272d]">{displayTitle}</h1>
                    </div>
                    <span aria-hidden />
                </header>

                {loading ? (
                    <StateCard text="در حال بارگذاری…" />
                ) : error ? (
                    <StateCard text="ارتباط با سرور برقرار نشد." />
                ) : orderedCourses.length === 0 ? (
                    <StateCard text="هنوز محتوایی برای این بخش ثبت نشده است." />
                ) : layout === "hsk" ? (
                    <div className="motion-list grid grid-cols-3 gap-2.5">
                        {orderedCourses.map((course) => (
                            <PosterCourseCard
                                key={course.id}
                                course={course}
                                href={getCourseHref(detailPath, course)}
                                layout="square"
                                countLabel={displayCountLabel}
                                countKeys={countKeys}
                            />
                        ))}
                    </div>
                ) : layout === "list" ? (
                    <div className="motion-list grid grid-cols-3 gap-2.5">
                        {orderedCourses.map((course) => (
                            <PosterCourseCard
                                key={course.id}
                                course={course}
                                href={getCourseHref(detailPath, course)}
                                layout="square"
                                countLabel={displayCountLabel}
                                countKeys={countKeys}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="motion-list grid grid-cols-3 gap-2.5">
                        {orderedCourses.map((course) => (
                            <PosterCourseCard
                                key={course.id}
                                course={course}
                                href={getCourseHref(detailPath, course)}
                                layout={layout}
                                countLabel={displayCountLabel}
                                countKeys={countKeys}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function StateCard({ text }: { text: string }) {
    return (
        <div className="rounded-[22px] border border-[#dfe6f0] bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            {text}
        </div>
    );
}

function PosterCourseCard({
    course,
    href,
    layout,
    countLabel,
    countKeys,
}: {
    course: Course;
    href: string;
    layout: CourseExploreLayout;
    countLabel: string;
    countKeys: string[];
}) {
    const rating = getCourseMetaNumber(course, "rating", 0);
    const countText = getDisplayCount(course, countKeys, countLabel);
    const titleProps = getDirectionalTextProps(course.title);

    return (
        <Link href={href} className="group">
            <article className="overflow-hidden rounded-[18px] bg-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.10)]">
                <CourseImage course={course} className={layout === "portrait" ? "aspect-[3/4] rounded-[18px]" : "aspect-square rounded-[18px]"} />
                <div className="px-1.5 pb-2 pt-1.5">
                    <div className="mb-1 h-1 rounded-full bg-[#c7e3fb]">
                        <div className="h-full w-2/3 rounded-full bg-[#155aa6]" />
                    </div>
                    <h3 className={`line-clamp-1 text-[11px] font-black leading-5 text-slate-900 ${getTextAlign(course.title)}`} {...titleProps}>{course.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        {rating > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6df] px-2 py-1 font-black text-[#b87a00]">
                                <Star size={11} className="fill-current" />
                                {rating}
                            </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-500">{countText}</span>
                    </div>
                </div>
            </article>
        </Link>
    );
}

function CourseImage({ course, className }: { course: Course; className: string }) {
    return (
        <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
            {course.cover_image_url ? (
                <Image
                    src={getMediaUrl(course.cover_image_url)}
                    alt={course.title}
                    fill
                    sizes="180px"
                    className="object-cover"
                    unoptimized
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eef6ff] to-[#fff6df] text-[#155aa6]">
                    <BookOpen size={24} />
                </div>
            )}
        </div>
    );
}
