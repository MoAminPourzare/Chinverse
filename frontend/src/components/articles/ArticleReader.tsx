"use client";

import Image from "@/components/ui/PublicMediaImage";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Clock3, Loader2, MessageCircle } from "lucide-react";
import { BackButton } from "@/components/ui/IconButton";
import { ArticleBody } from "./ArticleBody";
import { articleHref, articleMediaUrl, readingMinutes } from "@/lib/articles";
import { getDirectionalTextProps } from "@/lib/textDirection";
import { useOptionalCurrentUserId } from "@/hooks/useOptionalCurrentUserId";
import { communityService, type ArticleDetail } from "@/services/community.service";
import { validateTextLength, validationMessage } from "@/validation";

export function ArticleReader({ identifier }: { identifier: string }) {
    const currentUserId = useOptionalCurrentUserId();
    const [article, setArticle] = useState<ArticleDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [draft, setDraft] = useState("");
    const [commentError, setCommentError] = useState("");
    const [commentSaved, setCommentSaved] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const requestId = useRef(0);
    const load = useCallback(async () => {
        const request = ++requestId.current;
        setIsLoading(true);
        setLoadError("");
        try {
            const result = /^\d+$/.test(identifier)
                ? await communityService.getArticle(Number(identifier))
                : await communityService.getArticleBySlug(identifier);
            if (request === requestId.current) setArticle(result);
        } catch (error) {
            if (request === requestId.current) setLoadError((error as { response?: { status?: number } }).response?.status === 404
                ? "این مقاله پیدا نشد یا دیگر در دسترس نیست."
                : "مقاله باز نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.");
        } finally {
            if (request === requestId.current) setIsLoading(false);
        }
    }, [identifier]);
    const invalidate = useCallback(() => { requestId.current++; }, []);
    useEffect(() => { void load(); return invalidate; }, [load, invalidate]);

    async function sendComment(event: React.FormEvent) {
        event.preventDefault();
        if (!article || submitting) return;
        setCommentSaved(false);
        const content = draft.trim();
        const invalid = validationMessage(validateTextLength(content, "دیدگاه", { required: true, max: 8000 }));
        if (invalid) { setCommentError(invalid); return; }
        setSubmitting(true);
        setCommentError("");
        try {
            const comment = await communityService.createArticleComment(article.id, { content });
            setArticle(previous => previous ? { ...previous, comments: [...previous.comments, comment], comments_count: previous.comments_count + 1 } : previous);
            setDraft("");
            setCommentSaved(true);
        } catch (error) {
            const status = (error as { response?: { status?: number } }).response?.status;
            setCommentError(status === 403 ? "برای ثبت دیدگاه، تأیید حساب کاربری‌ات را کامل کن." : status === 401 ? "برای ثبت دیدگاه دوباره وارد حساب شو." : "دیدگاه ثبت نشد. لطفاً دوباره تلاش کن.");
        } finally { setSubmitting(false); }
    }

    const headings = article?.document?.blocks.flatMap((block, index) => block.type === "heading" ? [{ text: block.text, id: `section-${index}` }] : []) || [];
    return <div className="min-h-full bg-[#f9fafc] px-5 pb-10 pt-4" dir="rtl">
        <header data-page-header className="relative mb-6 flex h-12 items-center justify-center">
            <BackButton href="/community?section=articles" className="absolute left-0" />
            <span className="text-sm font-bold text-slate-600">مقالات چین‌ورس</span>
        </header>
        {isLoading ? <div role="status" className="flex justify-center gap-2 py-20 text-sm text-slate-500"><Loader2 aria-hidden className="size-5 animate-spin" />در حال باز کردن مقاله…</div> : loadError || !article ? <div role="alert" className="rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-8 text-slate-600"><p>{loadError}</p><button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-xl bg-[#155aa6] px-5 font-bold text-white">تلاش دوباره</button></div> : <>
            <article>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold leading-6 text-[#155aa6]"><BookOpen aria-hidden className="size-3.5" />{article.document?.category || "یادگیری زبان چینی"}</span>
                <h1 {...getDirectionalTextProps(article.title)} className="mt-4 text-[23px] font-black leading-10 text-slate-900">{article.title}</h1>
                {(article.document?.subtitle || article.summary) && <p className="mt-3 text-[14px] leading-8 text-slate-600">{article.document?.subtitle || article.summary}</p>}
                <div className="my-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] leading-6 text-slate-500">
                    <span>{article.author?.display_name || "چین‌ورس"}</span>
                    <time dateTime={article.created_at}>{new Date(article.created_at).toLocaleDateString("fa-IR")}</time>
                    <span className="flex items-center gap-1.5"><Clock3 aria-hidden className="size-3.5" />{readingMinutes(article.content).toLocaleString("fa-IR")} دقیقه مطالعه</span>
                </div>
                {article.cover_image && <div className="relative mb-7 aspect-[3/2] overflow-hidden rounded-[24px] bg-slate-100"><Image src={articleMediaUrl(article.cover_image)} alt={`تصویر مقالهٔ ${article.title}`} fill sizes="(max-width: 480px) 100vw, 420px" priority className="object-cover" /></div>}
                {headings.length > 0 && <details className="mb-8 rounded-2xl border border-slate-200 bg-white p-4">
                    <summary className="min-h-11 cursor-pointer text-sm font-bold leading-[44px] text-slate-800">در این مقاله می‌خوانی</summary>
                    <nav aria-label="فهرست مقاله" className="mt-2 flex flex-col">{headings.map(heading => <a key={heading.id} href={`#${heading.id}`} className="min-h-11 rounded-lg px-2 py-2 text-[13px] leading-7 text-[#155aa6] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-[#155aa6]">{heading.text}</a>)}</nav>
                </details>}
                <ArticleBody document={article.document} content={article.content} />
            </article>
            <section aria-labelledby="article-comments-title" className="mt-10 border-t border-slate-200 pt-7">
                <h2 id="article-comments-title" className="mb-5 flex items-center gap-2 text-base font-black text-slate-900"><MessageCircle aria-hidden className="size-5 text-[#155aa6]" />دیدگاه‌ها <span className="text-xs font-normal text-slate-500">({article.comments_count.toLocaleString("fa-IR")})</span></h2>
                <div className="space-y-3">{article.comments.map(comment => <div key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"><span className="font-bold text-slate-700">{comment.author?.display_name || "زبان‌آموز"}</span><time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString("fa-IR")}</time></div>
                    <p {...getDirectionalTextProps(comment.content)} className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{comment.content}</p>
                </div>)}</div>
                {!article.comments.length && <p className="mb-5 text-xs leading-7 text-slate-500">اولین دیدگاه دربارهٔ این مقاله را تو بنویس.</p>}
                {currentUserId ? <form onSubmit={sendComment} className="mt-5 space-y-3">
                    <label htmlFor="article-comment" className="block text-xs font-bold text-slate-700">دیدگاه شما</label>
                    <textarea id="article-comment" value={draft} onChange={event => { setDraft(event.target.value); setCommentSaved(false); }} maxLength={8000} rows={3} placeholder="دیدگاهت رو بنویس" dir="rtl" disabled={submitting} className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-right text-sm leading-7 outline-none placeholder:text-right focus:border-[#155aa6] focus:ring-2 focus:ring-blue-100" />
                    {commentError && <p role="alert" className="text-xs leading-6 text-red-600">{commentError}</p>}
                    {commentSaved && <p role="status" className="text-xs leading-6 text-[#155aa6]">دیدگاهت ثبت شد.</p>}
                    <button type="submit" disabled={submitting || !draft.trim()} className="min-h-11 rounded-xl bg-[#155aa6] px-5 text-sm font-bold text-white disabled:opacity-50">{submitting ? "در حال ثبت…" : "ثبت دیدگاه"}</button>
                </form> : <Link href={`/login?next=${encodeURIComponent(articleHref(article))}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-4 text-xs font-bold text-[#155aa6]">برای ثبت دیدگاه وارد حساب شو</Link>}
            </section>
        </>}
    </div>;
}
