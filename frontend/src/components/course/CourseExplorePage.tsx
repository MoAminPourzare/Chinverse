"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Play, Star } from "lucide-react";
import {
    Course,
    fetchCoursesBySubcategory,
    getCourseMetaNumber,
    getDisplayCount,
    getLessonCount,
} from "@/lib/courses";
import { getMediaUrl } from "@/lib/media";
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
const hskGradients = [
    "from-[#155aa6] to-[#0f4e92]",
    "from-[#50bca4] to-[#15806f]",
    "from-[#ffb74d] to-[#d88713]",
    "from-[#4f9de8] to-[#155aa6]",
    "from-[#64748b] to-[#334155]",
    "from-[#38bdf8] to-[#0f7f88]",
];

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
                    <StateCard text="در حال بارگذاری..." />
                ) : error ? (
                    <StateCard text="ارتباط با سرور برقرار نشد." />
                ) : orderedCourses.length === 0 ? (
                    <StateCard text="هنوز محتوایی برای این بخش ثبت نشده است." />
                ) : layout === "hsk" ? (
                    <div className="grid grid-cols-3 gap-2.5">
                        {orderedCourses.map((course) => (
                            <HskCourseCard key={course.id} course={course} detailPath={detailPath} />
                        ))}
                    </div>
                ) : layout === "list" ? (
                    <div className="space-y-3">
                        {orderedCourses.map((course) => (
                            <ListCourseCard
                                key={course.id}
                                course={course}
                                href={getCourseHref(detailPath, course)}
                                countLabel={displayCountLabel}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
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

function HskCourseCard({ course, detailPath }: { course: Course; detailPath: string }) {
    const hskLevel = String(getCourseMetaNumber(course, "hsk_level", Number(course.level) || 0) || course.level || "");
    const hskNumber = Number(hskLevel);
    const gradientClass = hskGradients[(Number.isFinite(hskNumber) ? Math.max(0, hskNumber - 1) : 0) % hskGradients.length];
    const wordCount = ["150", "300", "600", "1200", "2500", "5000"][Number(hskLevel) - 1];

    return (
        <Link href={getCourseHref(detailPath, course)} className="group">
            <article className={`flex h-[118px] flex-col justify-between overflow-hidden rounded-[18px] bg-gradient-to-br ${gradientClass} p-3 text-white shadow-[0_10px_22px_rgba(15,23,42,0.13)] transition hover:-translate-y-0.5`}>
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">HSK</div>
                <div className="text-center">
                    <div className="font-latin text-[30px] font-black leading-none" lang="en">{hskLevel}</div>
                    <p className="mt-1 text-[11px] font-bold text-white/80">{course.title}</p>
                </div>
                <div className="text-center text-[10px] font-bold text-white/70">{wordCount ? `${wordCount} واژه` : course.level}</div>
            </article>
        </Link>
    );
}

function ListCourseCard({ course, href, countLabel }: { course: Course; href: string; countLabel: string }) {
    const totalLessons = getLessonCount(course);
    const countText = totalLessons > 0 ? `${totalLessons} ${countLabel}` : course.level;

    return (
        <Link href={href} className="block">
            <article className="grid grid-cols-[82px_1fr] gap-3 rounded-[20px] border border-white/80 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-[#d5e1ef] hover:bg-[#fbfdff]">
                <CourseImage course={course} className="h-[82px] rounded-[16px]" />
                <div className="min-w-0">
                    <h3 className="line-clamp-1 text-sm font-black text-slate-950">{course.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{course.description}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#eef6ff] px-2.5 py-1 text-[10px] font-black text-[#155aa6]">{countText}</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff6df] text-[#b87a00]">
                            <Play size={14} className="fill-current" />
                        </span>
                    </div>
                </div>
            </article>
        </Link>
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

    return (
        <Link href={href} className="group">
            <article className="overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-[#d5e1ef]">
                <CourseImage course={course} className={layout === "portrait" ? "aspect-[3/4]" : "aspect-square"} />
                <div className="p-3">
                    <h3 className="line-clamp-2 text-[13px] font-black leading-5 text-slate-950">{course.title}</h3>
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
