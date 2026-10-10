import Image from "@/components/ui/PublicMediaImage";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock3 } from "lucide-react";
import { articleHref, articleMediaUrl, readingMinutes } from "@/lib/articles";
import { getDirectionalTextProps } from "@/lib/textDirection";
import type { Article } from "@/services/community.service";

export function ArticleLibrary({ articles }: { articles: Article[] }) {
    if (!articles.length) return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
            <BookOpen aria-hidden className="mx-auto mb-4 size-7 text-[#155aa6]" />
            <p className="text-sm font-bold text-slate-700">هنوز مقاله‌ای منتشر نشده است.</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">مقاله‌های تازه را همین‌جا خواهی دید.</p>
        </div>
    );

    return <div className="space-y-5">
        {articles.map((article) => (
            <Link key={article.id} href={articleHref(article)} className="group block overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)] transition hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#155aa6]">
                {article.cover_image && <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                    <Image src={articleMediaUrl(article.cover_image)} alt="" fill sizes="(max-width: 480px) 100vw, 420px" className="object-cover transition duration-500 group-hover:scale-[1.02]" />
                </div>}
                <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-[#155aa6]">{article.document?.category || "یادگیری زبان چینی"}</span>
                        <span className="flex items-center gap-1.5 text-slate-500"><Clock3 aria-hidden className="size-3.5" />{readingMinutes(article.content).toLocaleString("fa-IR")} دقیقه مطالعه</span>
                    </div>
                    <h3 {...getDirectionalTextProps(article.title)} className="text-[17px] font-black leading-8 text-slate-900">{article.title}</h3>
                    {article.summary && <p {...getDirectionalTextProps(article.summary)} className="mt-2 text-[13px] leading-7 text-slate-600">{article.summary}</p>}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                        <span className="text-slate-500">{article.author?.display_name || "چین‌ورس"}</span>
                        <span className="flex items-center gap-2 font-bold text-[#155aa6]">خواندن مقاله <ArrowLeft aria-hidden className="size-4" /></span>
                    </div>
                </div>
            </Link>
        ))}
    </div>;
}
