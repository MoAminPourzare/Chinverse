"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Loader2, MoreVertical, Play } from "lucide-react";
import CourseDetailPage from "@/components/course/CourseDetailPage";
import { BackButton } from "@/components/ui/IconButton";
import { checkCourseSaved, saveCourse, unsaveCourse } from "@/lib/courses";
import { getMusicArtist } from "@/lib/musicArtistCatalog";
import { getReturnToHref } from "@/lib/returnTo";
import { getFirstPublishedScreenMediaLesson } from "@/lib/screenMediaCatalog";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

export default function MusicArtistDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const artist = getMusicArtist(params?.id);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse("music", artist);
    const publishedTrack = getFirstPublishedScreenMediaLesson(publishedCourse);
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

    if (!artist && /^\d+$/.test(params?.id || "")) {
        return (
            <CourseDetailPage
                domain="music"
                explorePath="/explore/music"
                eyebrow="موسیقی"
                countKeys={["tracks_count"]}
                countLabel="آهنگ"
                accentClass="bg-[#155aa6]"
            />
        );
    }

    if (!artist) {
        return (
            <div className="flex min-h-full items-center justify-center bg-[#f7f8fa] p-5 dark:bg-[#10151c]" dir="rtl">
                <div className="rounded-[24px] border border-[#dfe6f0] bg-white p-8 text-center dark:border-slate-700 dark:bg-[#18212b]">
                    <h1 className="text-lg font-black text-slate-900 dark:text-white">این هنرمند پیدا نشد</h1>
                    <Link href="/explore/music" className="mt-5 inline-flex rounded-[14px] bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white">بازگشت به موسیقی</Link>
                </div>
            </div>
        );
    }

    const playbackHref = publishedCourse && publishedTrack
        ? `/watch/music/${publishedCourse.id}?lesson=${publishedTrack.id}`
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
            alert("برای ذخیره کردن این هنرمند باید وارد حساب کاربری شوی.");
        } finally {
            setSavingBookmark(false);
        }
    };

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto w-full max-w-[430px] px-4 py-4">
                <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between bg-[#f7f8fa]/92 px-4 py-2 backdrop-blur dark:bg-[#10151c]/92" dir="ltr">
                    <BackButton href="/explore/music" label="بازگشت به فهرست موسیقی" />
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

                <section className="mt-3 grid grid-cols-[1fr_46%] items-center gap-4" dir="ltr">
                    <div className="min-w-0 text-center" dir="ltr">
                        <h1 className="text-[20px] font-black leading-8 text-[#343941] dark:text-white">{artist.title}</h1>
                        <p className="mt-1 text-[13px] font-medium leading-5 text-[#59616c] dark:text-slate-300">{artist.pinyin}</p>
                        <p className="mt-3 text-[11px] font-medium leading-5 text-[#59616c] dark:text-slate-300" dir="rtl">سرگرمی و رسانه</p>
                        <p className="mt-1 text-[10px] font-bold text-[#667587] dark:text-slate-300" dir="rtl">امتیازدهی پس از انتشار فعال می‌شود</p>
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-[12px] bg-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                        <Image src={artist.portraitPath} alt={`تصویر ${artist.displayName}`} fill sizes="185px" className="object-cover" priority />
                    </div>
                </section>

                <section className="mt-6" aria-labelledby="artist-biography-heading">
                    <h2 id="artist-biography-heading" className="text-sm font-black text-[#343941] dark:text-white">بیوگرافی:</h2>
                    {artist.biography.map((paragraph) => (
                        <p key={paragraph} className="mt-2 text-right text-[12px] font-medium leading-7 text-[#40464f] dark:text-slate-300">{paragraph}</p>
                    ))}
                </section>

                <section className="mt-5" aria-labelledby="artist-styles-heading">
                    <h2 id="artist-styles-heading" className="text-sm font-black text-[#343941] dark:text-white">سبک:</h2>
                    <ul className="mt-1 space-y-1 text-[12px] font-medium leading-6 text-[#40464f] dark:text-slate-300">
                        {artist.styles.map((style) => <li key={style}>• {style}</li>)}
                    </ul>
                </section>

                <section className="mt-6 rounded-[16px] border border-[#dfe6f0] bg-white p-4 dark:border-slate-700 dark:bg-[#18212b]" aria-label="وضعیت پخش آثار">
                    {playbackHref ? (
                        <Link href={playbackHref} className="flex min-h-11 items-center justify-center gap-2 rounded-[12px] bg-[#155aa6] px-4 py-3 text-sm font-black text-white transition hover:bg-[#104a89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6]/40">
                            <Play size={18} fill="currentColor" aria-hidden />
                            شنیدن آثار {artist.displayName}
                        </Link>
                    ) : (
                        <p className="text-center text-xs font-medium leading-6 text-[#646d79] dark:text-slate-300">
                            {hasError ? "وضعیت آثار منتشرشده دریافت نشد؛ دوباره صفحه را باز کن." : isLoading ? "در حال بررسی آثار منتشرشده…" : "هنوز اثری برای پخش منتشر نشده است."}
                        </p>
                    )}
                </section>
            </main>
        </div>
    );
}
