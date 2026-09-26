import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/IconButton";
import { PODCAST_CATALOG, getPodcastEpisodeCount } from "@/lib/podcastCatalog";

export default function PodcastExplorePage() {
    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-5 px-4 py-5">
                <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3" dir="ltr">
                    <BackButton href="/explore" label="بازگشت به کاوش" />
                    <h1 className="text-center text-[22px] font-black text-[#343941] dark:text-white">پادکست آموزشی</h1>
                    <span aria-hidden />
                </header>
                <div className="motion-list grid grid-cols-3 gap-2.5" dir="ltr">
                    {PODCAST_CATALOG.map((podcast) => (
                        <Link key={podcast.slug} href={`/podcasts/${podcast.slug}`} className="group min-w-0 overflow-hidden rounded-[14px] bg-[#e3e7ed] pb-2.5 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] dark:bg-[#222c38]">
                            <div className="relative aspect-square overflow-hidden rounded-[13px] bg-slate-200">
                                <Image src={podcast.coverPath} alt={`کاور ${podcast.title}`} fill sizes="(max-width: 430px) 31vw, 125px" className="object-cover transition duration-300 group-hover:scale-[1.03]" />
                            </div>
                            <div className="px-1.5 pt-1.5 text-left">
                                <h2 className="line-clamp-2 min-h-8 text-[11px] font-bold leading-4 text-[#343941] dark:text-white">{podcast.title}</h2>
                                <p className="mt-1 text-[10px] text-[#737b87] dark:text-slate-400" dir="rtl">{getPodcastEpisodeCount(podcast)} قسمت</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
