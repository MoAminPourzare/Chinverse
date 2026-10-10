"use client";

import Image from "next/image";
import Link from "@/components/ui/ReturnAwareLink";
import { useParams, useRouter } from "next/navigation";
import { MoreVertical, Music2, Star } from "lucide-react";
import CourseDetailPage from "@/components/course/CourseDetailPage";
import ReferenceIntroduction from "@/components/course/ReferenceIntroduction";
import { BackButton } from "@/components/ui/IconButton";
import CollectionBookmarkButton from "@/components/course/CollectionBookmarkButton";
import { getMusicArtist } from "@/lib/musicArtistCatalog";
import { getReturnToHref } from "@/lib/returnTo";
import { getPublishedMusicReleaseLesson } from "@/lib/musicPublished";
import { usePublishedPlannedCourse } from "@/lib/usePublishedPlannedCourse";

export default function MusicArtistDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const artist = getMusicArtist(params?.id);
    const { publishedCourse, isLoading, hasError } = usePublishedPlannedCourse("music", artist);


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
                    <Link back href="/explore/music" className="mt-5 inline-flex rounded-[14px] bg-[#155aa6] px-4 py-2.5 text-sm font-black text-white">بازگشت به موسیقی</Link>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto w-full max-w-[430px] px-6 py-4">
                <div data-page-header className="sticky top-0 z-10 -mx-6 bg-[#f7f8fa] px-6 pb-5 dark:bg-[#10151c]">
                    <header className="-mx-2 flex items-center justify-between py-2" dir="ltr">
                        <BackButton href="/explore/music" label="بازگشت به فهرست موسیقی" />
                        <div className="flex items-center gap-1">
                            <CollectionBookmarkButton domain={"music"} slug={artist.slug} courseId={publishedCourse?.id} />
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

                    <section className="mt-4 grid grid-cols-2 items-center gap-4" dir="ltr">
                        <div className="min-w-0 text-center" dir="ltr">
                            <h1 className="font-cjk text-[20px] leading-8 text-[#343941] dark:text-white">{artist.title}</h1>
                            <p className="mt-1 text-[13px] font-medium leading-5 text-[#59616c] dark:text-slate-300">{artist.pinyin}</p>
                            <p className="mt-3 text-[11px] font-medium leading-5 text-[#59616c] dark:text-slate-300" dir="rtl">سرگرمی و رسانه | ؟ دقیقه</p>
                            <div className="mt-3 flex justify-center gap-1" aria-hidden="true">
                                {Array.from({ length: 5 }, (_, index) => <Star key={index} size={19} className={index < 4 ? "fill-[#f3ac25] text-[#f3ac25]" : "text-[#9ba4af]"} />)}
                            </div>
                            <button type="button" disabled aria-label="ثبت نظر پس از انتشار فعال می‌شود" className="mt-1.5 text-[10px] font-medium text-[#1768d4] disabled:cursor-not-allowed">ثبت نظر</button>
                        </div>
                        <div className={`relative w-full overflow-hidden bg-slate-200 ${artist.portraitAspect === "portrait" ? "aspect-[3/4] max-w-[116px]" : "aspect-square rounded-[10px]"}`}>
                            <Image src={artist.detailPortraitPath || artist.portraitPath} alt={`تصویر ${artist.displayName}`} fill sizes="155px" className="object-contain" priority />
                        </div>
                    </section>
                </div>

                <ReferenceIntroduction heading="بیوگرافی:" paragraphs={artist.biography} />
                <section className="mt-6 text-right text-[12px] leading-6 text-[#40464f] dark:text-slate-300" aria-label="سبک">
                    <h2 className="font-bold text-[#343941] dark:text-white">سبک:</h2>
                    <p>{artist.styles.join(" / ")}</p>
                </section>

                <section className="mt-5 space-y-2" aria-label={`آثار ${artist.displayName}`}>
                    {artist.releases.map((release) => {
                        const publishedTrack = getPublishedMusicReleaseLesson(publishedCourse, release);
                        const href = publishedCourse && publishedTrack
                            ? `/watch/music/${publishedCourse.id}?lesson=${publishedTrack.id}`
                            : undefined;
                        const status = hasError ? "وضعیت پخش نامشخص است"
                            : isLoading ? "در حال بررسی اثر…"
                                : href ? "آمادهٔ پخش" : "هنوز منتشر نشده";
                        const content = (
                            <article className="grid min-h-32 grid-cols-[1fr_40%] gap-2">
                                <div className="flex min-w-0 flex-col px-2.5 py-3 text-left">
                                    <h2 className="text-[18px] leading-7 text-[#353941] dark:text-white">
                                        <span className="font-cjk" lang="zh">{release.kind === "song" ? `《${release.title}》` : release.title}</span>
                                        {release.kind === "album" && <span className="ml-1 text-[10px]">({release.year})</span>}
                                    </h2>
                                    {release.kind === "album" && <p className="mt-0.5 text-[12px] text-[#828994] dark:text-slate-400" aria-label={`${release.trackCount} آهنگ`}><span lang="zh">{release.trackCount}首</span></p>}
                                    <div className="mt-auto pt-3" dir="rtl">
                                        <div className="h-[3px] rounded-full bg-[#a8d6ff]" aria-hidden="true" />
                                        <p className="mt-1 text-[10px] leading-4 text-[#58616d] dark:text-slate-300">{status}</p>
                                    </div>
                                </div>
                                <div className={`relative mr-1.5 flex overflow-hidden bg-slate-100 dark:bg-slate-700 ${release.kind === "song" ? "my-auto aspect-video" : "my-1.5 rounded-[8px]"}`}>
                                    {release.coverPaths?.length ? release.coverPaths.map((cover, index) => (
                                        <div key={cover} className="relative min-w-0 flex-1 overflow-hidden">
                                            <Image src={cover} alt={`کاور ${release.title}${release.coverPaths!.length > 1 ? ` – بخش ${index + 1}` : ""}`} fill sizes="130px" className="object-cover" style={{ objectPosition: release.coverPositions?.[index] }} />
                                        </div>
                                    )) : <div className="flex w-full items-center justify-center text-[#9aa5b3]" role="img" aria-label={`تصویر آهنگ ${release.title} هنوز اضافه نشده`}><Music2 size={28} aria-hidden="true" /></div>}
                                </div>
                            </article>
                        );
                        return (
                            <Link key={release.slug} href={href || `/music/${artist.slug}/release/${release.slug}`} className="block overflow-hidden rounded-[10px] bg-[#e2e5eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#202b3a]" dir="ltr" aria-label={`باز کردن ${release.title}`}>
                                {content}
                            </Link>
                        );
                    })}
                </section>
            </main>
        </div>
    );
}
