"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2, MoreVertical, Play, Star } from "lucide-react";
import CourseDetailPage from "@/components/course/CourseDetailPage";
import { BackButton } from "@/components/ui/IconButton";
import { checkCourseSaved, saveCourse, unsaveCourse } from "@/lib/courses";
import { getReturnToHref } from "@/lib/returnTo";
import {
    getFirstPublishedScreenMediaLesson,
    getPublishedSeriesEpisode,
    getScreenMediaItem,
    type ScreenMediaCatalogItem,
} from "@/lib/screenMediaCatalog";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

interface ScreenMediaDetailPageProps {
    domain: string;
    title: string;
    itemNoun: string;
    catalog: ScreenMediaCatalogItem[];
    showEpisodes?: boolean;
    showMovieCard?: boolean;
    showSeriesCards?: boolean;
    showAnimationCards?: boolean;
}

function DetailList({ items }: { items: string[] }) {
    return (
        <ul className="mt-1 space-y-1 text-[12px] font-medium leading-6 text-[#40464f] dark:text-slate-300">
            {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
    );
}

export default function ScreenMediaDetailPage({
    domain,
    title,
    itemNoun,
    catalog,
    showEpisodes = false,
    showMovieCard = false,
    showSeriesCards = false,
    showAnimationCards = false,
}: ScreenMediaDetailPageProps) {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const item = getScreenMediaItem(catalog, params?.id);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse(domain, item);
    const publishedLesson = getFirstPublishedScreenMediaLesson(publishedCourse);
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

    if (!item && /^\d+$/.test(params?.id || "")) {
        return (
            <CourseDetailPage
                domain={domain}
                explorePath={`/explore/${domain}`}
                eyebrow={itemNoun}
                countKeys={["episodes_count"]}
                countLabel={showEpisodes ? "قسمت" : "بخش"}
                accentClass="bg-[#155aa6]"
            />
        );
    }

    if (!item) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa] p-5 dark:bg-[#10151c]" dir="rtl">
                <div className="rounded-[24px] border border-[#dfe6f0] bg-white p-8 text-center dark:border-slate-700 dark:bg-[#18212b]">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white">این {itemNoun} پیدا نشد</h1>
                    <Link href={`/explore/${domain}`} className="mt-5 inline-flex rounded-[14px] bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white">بازگشت به {title}</Link>
                </div>
            </div>
        );
    }

    const playbackHref = publishedCourse && publishedLesson
        ? `/watch/${domain}/${publishedCourse.id}?lesson=${publishedLesson.id}`
        : undefined;

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
            alert(`برای ذخیره کردن این ${itemNoun} باید وارد حساب کاربری شوی.`);
        } finally {
            setSavingBookmark(false);
        }
    };

    if (showMovieCard || (showAnimationCards && !item.episodeCount)) {
        const previewStatus = hasError
            ? "وضعیت پخش دریافت نشد؛ دوباره تلاش کن."
            : isLoading
                ? "در حال بررسی نسخهٔ ویدیویی…"
                : playbackHref
                    ? publishedLesson?.duration_minutes
                        ? `${publishedLesson.duration_minutes} دقیقه · آمادهٔ تماشا`
                        : "آمادهٔ تماشا"
                    : "نسخهٔ ویدیویی هنوز منتشر نشده است.";
        const previewContent = (
            <>
                <div className="flex min-w-0 flex-1 flex-col px-2.5 py-3" dir="ltr">
                    <span className="font-cjk text-[17px] font-semibold leading-6 text-[#353941] dark:text-white">{item.title}</span>
                    <span className="mt-0.5 text-[10px] font-semibold text-[#69717c] dark:text-slate-300">{item.englishTitle || item.pinyin}</span>
                    <div className="mt-auto" dir="rtl">
                        <div className="h-[3px] rounded-full bg-[#a8d6ff]" aria-hidden="true" />
                        <p className="mt-1 text-[10px] leading-4 text-[#58616d] dark:text-slate-300">{previewStatus}</p>
                    </div>
                </div>
                <div className="relative my-1.5 mr-1.5 w-[40%] shrink-0 overflow-hidden rounded-[8px] bg-slate-200">
                    <Image src={item.previewImagePath || item.posterPath} alt={`نمایی از ${itemNoun} ${item.title}`} fill sizes="130px" className="object-cover" />
                </div>
            </>
        );

        return (
            <div className="min-h-full bg-white pb-28 dark:bg-[#10151c]" dir="rtl">
                <main className="mx-auto w-full max-w-[430px] px-6 py-4">
                    <header className="-mx-2 flex items-center justify-between py-2" dir="ltr">
                        <BackButton href={`/explore/${domain}`} label={`بازگشت به فهرست ${title}`} />
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={handleToggleSaved} disabled={!publishedCourse || savingBookmark} aria-label={publishedCourse ? (isSaved ? "حذف از منتخب‌ها" : "ذخیره در منتخب‌ها") : "ذخیره‌سازی پس از انتشار فعال می‌شود"} className="flex h-10 w-10 items-center justify-center rounded-full text-[#333941] disabled:cursor-not-allowed dark:text-slate-100">
                                {savingBookmark ? <Loader2 size={21} className="animate-spin" /> : isSaved ? <BookmarkCheck size={21} /> : <Bookmark size={21} />}
                            </button>
                            <button type="button" onClick={() => router.push(getReturnToHref("/settings/appearance"))} aria-label="تنظیمات نمایش" className="flex h-10 w-10 items-center justify-center rounded-full text-[#333941] dark:text-slate-100">
                                <MoreVertical size={22} />
                            </button>
                        </div>
                    </header>

                    <section className={`mt-4 grid items-center gap-4 ${showAnimationCards ? "grid-cols-2" : "grid-cols-[1fr_40%]"}`} dir="ltr">
                        <div className="min-w-0 text-center">
                            <h1 className={`font-cjk font-bold leading-7 text-[#343941] dark:text-white ${showAnimationCards ? "text-[17px]" : "text-[19px]"}`}>{item.title}</h1>
                            <p className="mt-1 text-[12px] text-[#454b55] dark:text-slate-300">{item.pinyin}</p>
                            <p className="mt-4 text-[11px] text-[#454b55] dark:text-slate-300" dir="rtl">سرگرمی و رسانه</p>
                            <div className="mt-3 flex justify-center gap-1" aria-hidden="true">
                                {Array.from({ length: 5 }, (_, index) => <Star key={index} size={19} className={index < 4 ? "fill-[#f3ac25] text-[#f3ac25]" : "text-[#9ba4af]"} />)}
                            </div>
                            <button type="button" disabled aria-label="ثبت نظر پس از انتشار فعال می‌شود" className="mt-1.5 text-[10px] font-medium text-[#1768d4] disabled:cursor-not-allowed">ثبت نظر</button>
                        </div>
                        <div className={`relative aspect-[2/3] overflow-hidden rounded-[8px] bg-slate-100 ${showAnimationCards ? "w-full max-w-[110px]" : ""}`}>
                            <Image src={item.posterPath} alt={`پوستر ${itemNoun} ${item.title}`} fill sizes="155px" className="object-cover" priority />
                        </div>
                    </section>

                    {showAnimationCards && (
                        <section className="mt-6 space-y-2" aria-label="خلاصهٔ داستان">
                            {item.synopsis.map((paragraph) => <p key={paragraph} className="text-right text-[12px] leading-6 text-[#40464f] dark:text-slate-300">{paragraph}</p>)}
                        </section>
                    )}

                    <dl className="mt-6 space-y-4 text-right">
                        {(showAnimationCards || item.showGenresInDetail) && <div><dt className="text-[12px] font-bold text-[#343941] dark:text-white">ژانر:</dt><dd className="mt-1 text-[12px] text-[#40464f] dark:text-slate-300">{item.genres.join("، ")}</dd></div>}
                        {item.showYearInDetail !== false && <div><dt className="text-[12px] font-bold text-[#343941] dark:text-white">سال انتشار:</dt><dd className="mt-1 text-[12px] text-[#40464f] dark:text-slate-300">{item.year} – {item.country}</dd></div>}
                        {showAnimationCards && item.credits ? item.credits.map((credit) => (
                            <div key={credit.label}><dt className="text-[12px] font-bold text-[#343941] dark:text-white">{credit.label}</dt><dd><DetailList items={credit.items} /></dd></div>
                        )) : <>
                            <div><dt className="text-[12px] font-bold text-[#343941] dark:text-white">کارگردان:</dt><dd><DetailList items={item.directors} /></dd></div>
                            <div><dt className="text-[12px] font-bold text-[#343941] dark:text-white">بازیگران اصلی:</dt><dd><DetailList items={item.cast} /></dd></div>
                        </>}
                    </dl>

                    {playbackHref ? (
                        <Link href={playbackHref} className="mt-7 flex min-h-32 overflow-hidden rounded-[10px] bg-[#e9edf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#202b3a]" dir="ltr" aria-label={`تماشای ${itemNoun} ${item.title}`}>
                            {previewContent}
                        </Link>
                    ) : (
                        <div className="mt-7 flex min-h-32 overflow-hidden rounded-[10px] bg-[#e9edf5] dark:bg-[#202b3a]" dir="ltr" aria-label={`وضعیت پخش ${itemNoun} ${item.title}`}>
                            {previewContent}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    if ((showSeriesCards || showAnimationCards) && item.episodeCount) {
        return (
            <div className="min-h-full bg-white pb-28 dark:bg-[#10151c]" dir="rtl">
                <main className="mx-auto w-full max-w-[430px] px-6 py-4">
                    <div className={showAnimationCards ? "sticky top-0 z-10 -mx-6 bg-white px-6 pb-5 dark:bg-[#10151c]" : undefined}>
                        <header className="-mx-2 flex items-center justify-between py-2" dir="ltr">
                            <BackButton href={`/explore/${domain}`} label={`بازگشت به فهرست ${title}`} />
                            <div className="flex items-center gap-1">
                                <button type="button" onClick={handleToggleSaved} disabled={!publishedCourse || savingBookmark} aria-label={publishedCourse ? (isSaved ? "حذف از منتخب‌ها" : "ذخیره در منتخب‌ها") : "ذخیره‌سازی پس از انتشار فعال می‌شود"} className="flex h-10 w-10 items-center justify-center rounded-full text-[#333941] disabled:cursor-not-allowed dark:text-slate-100">
                                    {savingBookmark ? <Loader2 size={21} className="animate-spin" /> : isSaved ? <BookmarkCheck size={21} /> : <Bookmark size={21} />}
                                </button>
                                <button type="button" onClick={() => router.push(getReturnToHref("/settings/appearance"))} aria-label="تنظیمات نمایش" className="flex h-10 w-10 items-center justify-center rounded-full text-[#333941] dark:text-slate-100">
                                    <MoreVertical size={22} />
                                </button>
                            </div>
                        </header>

                        <section className={`mt-4 grid items-center gap-4 ${showAnimationCards ? "grid-cols-2" : "grid-cols-[1fr_40%]"}`} dir="ltr">
                            <div className="min-w-0 text-center">
                                <h1 className={`font-cjk font-bold leading-7 text-[#343941] dark:text-white ${showAnimationCards ? "text-[17px]" : "text-[19px]"}`}>{item.detailTitleLines ? item.detailTitleLines.map((line) => <span key={line} className="block">{line}</span>) : item.title}</h1>
                                <p className="mt-1 text-[12px] text-[#454b55] dark:text-slate-300">{item.pinyin}</p>
                                <p className="mt-4 text-[11px] text-[#454b55] dark:text-slate-300" dir="rtl">سرگرمی و رسانه</p>
                                <div className="mt-3 flex justify-center gap-1" aria-hidden="true">
                                    {Array.from({ length: 5 }, (_, index) => <Star key={index} size={19} className={index < 4 ? "fill-[#f3ac25] text-[#f3ac25]" : "text-[#9ba4af]"} />)}
                                </div>
                                <button type="button" disabled aria-label="ثبت نظر پس از انتشار فعال می‌شود" className="mt-1.5 text-[10px] font-medium text-[#1768d4] disabled:cursor-not-allowed">ثبت نظر</button>
                            </div>
                            <div className={`relative overflow-hidden rounded-[8px] bg-slate-100 ${item.posterAspect === "landscape" ? "aspect-video" : `aspect-[2/3] ${showAnimationCards ? "w-full max-w-[110px]" : ""}`}`}>
                                <Image src={item.posterPath} alt={`پوستر ${itemNoun} ${item.title}`} fill sizes="155px" className="object-cover" priority />
                            </div>
                        </section>
                    </div>

                    <section className="mt-5 space-y-2" aria-label={`قسمت‌های ${itemNoun} ${item.title}`}>
                        {Array.from({ length: item.episodeCount }, (_, index) => {
                            const position = index + 1;
                            const publishedEpisode = getPublishedSeriesEpisode(publishedCourse, position);
                            const href = publishedCourse && publishedEpisode
                                ? `/watch/${domain}/${publishedCourse.id}?lesson=${publishedEpisode.id}`
                                : undefined;
                            const label = item.episodeLabelStyle === "padded"
                                ? `${String(position).padStart(2, "0")}集`
                                : `第${position}集`;
                            const status = hasError ? "وضعیت پخش نامشخص است"
                                : isLoading ? "در حال بررسی ویدیو…"
                                    : href ? "آمادهٔ پخش" : "هنوز منتشر نشده";
                            const thumbnail = item.episodeImagePaths?.[index];
                            const content = (
                                <article className="grid min-h-32 grid-cols-[1fr_40%] gap-2">
                                    <div className="flex min-w-0 flex-col px-2.5 py-3 text-left">
                                        <h2 className="font-cjk text-[18px] leading-7 text-[#353941] dark:text-white">{label}</h2>
                                        {item.episodeTitles?.[index] && <p className="mt-1 font-cjk text-[15px] leading-6 text-[#747b84] dark:text-slate-300" lang="zh">{item.episodeTitles[index]}</p>}
                                        <div className="mt-auto" dir="rtl">
                                            <div className="h-[3px] rounded-full bg-[#a8d6ff]" aria-hidden="true" />
                                            <p className="mt-1 text-[10px] leading-4 text-[#58616d] dark:text-slate-300">{status}</p>
                                        </div>
                                    </div>
                                    <div className="relative my-1.5 mr-1.5 overflow-hidden rounded-[8px] bg-[#f3f5f8] dark:bg-slate-700">
                                        {thumbnail
                                            ? <Image src={thumbnail} alt={`تصویر قسمت ${position} ${itemNoun} ${item.title}`} fill sizes="130px" className="object-cover" />
                                            : <span className="absolute inset-0 bg-[linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] bg-[length:14px_14px] bg-[position:0_0,0_7px,7px_-7px,-7px_0px] opacity-80 dark:opacity-10" aria-hidden="true" />}
                                    </div>
                                </article>
                            );
                            return href ? (
                                <Link key={position} href={href} className="block overflow-hidden rounded-[10px] bg-[#e9edf5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#202b3a]" dir="ltr" aria-label={`تماشای قسمت ${position} ${itemNoun} ${item.title}`}>
                                    {content}
                                </Link>
                            ) : (
                                <div key={position} className="overflow-hidden rounded-[10px] bg-[#e9edf5] dark:bg-[#202b3a]" dir="ltr">
                                    {content}
                                </div>
                            );
                        })}
                    </section>
                </main>
            </div>
        );
    }

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
                            aria-label="تنظیمات نمایش"
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#333941] transition hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <MoreVertical size={22} />
                        </button>
                    </div>
                </header>

                <section className="mt-3 grid grid-cols-[1fr_42%] items-center gap-4" dir="ltr">
                    <div className="min-w-0 text-center" dir="ltr">
                        <h1 className="text-[20px] font-black leading-8 text-[#343941] dark:text-white">{item.title}</h1>
                        <p className="mt-1 text-[12px] font-medium leading-5 text-[#59616c] dark:text-slate-300">{item.pinyin}</p>
                        <p className="mt-3 text-[11px] font-medium leading-5 text-[#59616c] dark:text-slate-300" dir="rtl">
                            سرگرمی و رسانه{item.episodeCount ? ` | ${item.episodeCount} قسمت` : ""}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-[#667587] dark:text-slate-300" dir="rtl">امتیازدهی فعلاً فعال نیست</p>
                    </div>
                    <div className="relative aspect-[2/3] overflow-hidden rounded-[10px] bg-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                        <Image src={item.posterPath} alt={`پوستر ${itemNoun} ${item.title}`} fill sizes="175px" className="object-cover" priority />
                    </div>
                </section>

                <section className="mt-6" aria-labelledby="screen-summary-heading">
                    <h2 id="screen-summary-heading" className="text-sm font-black text-[#343941] dark:text-white">خلاصهٔ داستان:</h2>
                    {item.synopsis.map((paragraph) => (
                        <p key={paragraph} className="mt-2 text-right text-[12px] font-medium leading-7 text-[#40464f] dark:text-slate-300">{paragraph}</p>
                    ))}
                </section>

                <dl className="mt-5 space-y-4 text-right">
                    <div>
                        <dt className="text-sm font-black text-[#343941] dark:text-white">ژانر:</dt>
                        <dd className="mt-1 text-[12px] font-medium leading-6 text-[#40464f] dark:text-slate-300">{item.genres.join("، ")}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-black text-[#343941] dark:text-white">سال انتشار:</dt>
                        <dd className="mt-1 text-[12px] font-medium leading-6 text-[#40464f] dark:text-slate-300">{item.year} — {item.country}</dd>
                    </div>
                    {item.credits ? item.credits.map((credit) => (
                        <div key={credit.label}>
                            <dt className="text-sm font-black text-[#343941] dark:text-white">{credit.label}</dt>
                            <dd><DetailList items={credit.items} /></dd>
                        </div>
                    )) : (
                        <>
                            <div>
                                <dt className="text-sm font-black text-[#343941] dark:text-white">کارگردان:</dt>
                                <dd><DetailList items={item.directors} /></dd>
                            </div>
                            <div>
                                <dt className="text-sm font-black text-[#343941] dark:text-white">بازیگران اصلی:</dt>
                                <dd><DetailList items={item.cast} /></dd>
                            </div>
                        </>
                    )}
                </dl>

                {showEpisodes && item.episodeCount ? (
                    <section className="mt-6" aria-labelledby="series-episodes-heading">
                        <div className="mb-3 flex items-end justify-between gap-3">
                            <div>
                                <h2 id="series-episodes-heading" className="text-base font-black text-[#343941] dark:text-white">قسمت‌ها</h2>
                                <p className="mt-1 text-[11px] leading-5 text-[#737b87] dark:text-slate-400">
                                    {hasError ? "وضعیت قسمت‌ها دریافت نشد؛ دوباره صفحه را باز کن." : isLoading ? "در حال بررسی قسمت‌های منتشرشده…" : "قسمت‌های آماده به پلیر وصل‌اند؛ بقیه هنوز منتشر نشده‌اند."}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#e8f2fd] px-2.5 py-1 text-[10px] font-black text-[#155aa6]">{item.episodeCount} قسمت</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2" dir="rtl">
                            {Array.from({ length: item.episodeCount }, (_, index) => {
                                const position = index + 1;
                                const episode = getPublishedSeriesEpisode(publishedCourse, position);
                                const className = "flex min-h-12 flex-col items-center justify-center rounded-[12px] border px-1.5 py-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6]";
                                if (publishedCourse && episode) {
                                    return (
                                        <Link key={position} href={`/watch/${domain}/${publishedCourse.id}?lesson=${episode.id}`} className={`${className} border-[#b9d7f5] bg-[#e8f2fd] text-[#155aa6] hover:bg-[#dbeeff] dark:border-[#31577c] dark:bg-[#18304a] dark:text-[#72b6ff]`}>
                                            <span className="text-[11px] font-black">قسمت {position}</span>
                                            <span className="mt-0.5 text-[9px] font-bold">آمادهٔ پخش</span>
                                        </Link>
                                    );
                                }
                                return (
                                    <div key={position} className={`${className} border-[#dfe6f0] bg-white text-[#59616c] dark:border-slate-700 dark:bg-[#18212b] dark:text-slate-300`}>
                                        <span className="text-[11px] font-black">قسمت {position}</span>
                                        <span className="mt-0.5 text-[9px] font-medium">منتشر نشده</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    <section className="mt-6 rounded-[16px] border border-[#dfe6f0] bg-white p-4 dark:border-slate-700 dark:bg-[#18212b]" aria-label={`وضعیت پخش ${itemNoun}`}>
                        {playbackHref ? (
                            <Link href={playbackHref} className="flex min-h-11 items-center justify-center gap-2 rounded-[12px] bg-[#155aa6] px-4 py-3 text-sm font-black text-white transition hover:bg-[#104a89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6]/40">
                                <Play size={18} fill="currentColor" aria-hidden />
                                تماشای {itemNoun}
                            </Link>
                        ) : (
                            <p className="text-center text-xs font-medium leading-6 text-[#646d79] dark:text-slate-300">
                                {hasError ? "وضعیت نسخهٔ ویدیویی دریافت نشد؛ دوباره صفحه را باز کن." : isLoading ? "در حال بررسی نسخهٔ ویدیویی…" : `نسخهٔ ویدیویی این ${itemNoun} هنوز منتشر نشده است.`}
                            </p>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}
