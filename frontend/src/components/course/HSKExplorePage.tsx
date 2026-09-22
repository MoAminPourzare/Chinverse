import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/ui/IconButton";
import { HSK_CATALOG } from "@/lib/hskCatalog";

export default function HSKExplorePage() {
    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28 dark:bg-[#10151c]" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-5 px-4 py-5">
                <header className="grid grid-cols-[40px_1fr_40px] items-center gap-3" dir="ltr">
                    <BackButton href="/explore" label="بازگشت به کاوش" />
                    <h1 className="text-center text-[22px] font-black tracking-wide text-[#25272d] dark:text-white">HSK</h1>
                    <span aria-hidden />
                </header>

                <div className="motion-list grid grid-cols-3 gap-2.5" dir="ltr">
                    {HSK_CATALOG.map((course) => (
                        <Link
                            key={course.slug}
                            href={`/hsk/${course.slug}`}
                            className="group min-w-0 rounded-[14px] bg-[#e3e7ed] pb-2.5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6] focus-visible:ring-offset-2 dark:bg-[#222c38]"
                        >
                            <div className="relative aspect-square overflow-hidden rounded-[13px] bg-slate-200">
                                <Image
                                    src={course.coverPath}
                                    alt={`جلد دورهٔ ${course.title}`}
                                    fill
                                    sizes="(max-width: 430px) 31vw, 125px"
                                    className="object-cover"
                                    priority={course.order <= 3}
                                />
                            </div>
                            <div className="px-1.5 pt-1.5 text-left" dir="ltr">
                                <div className="mb-1 h-[3px] overflow-hidden rounded-full bg-[#b8d9f5]">
                                    <div className="h-full w-[9%] rounded-full bg-[#155aa6]" />
                                </div>
                                <h2 className="truncate text-[11px] font-bold leading-5 text-[#343941] dark:text-white">{course.title}</h2>
                                <p className="text-[9px] font-medium text-[#8a929d] dark:text-slate-400" dir="rtl">{course.lessonCount} درس</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
