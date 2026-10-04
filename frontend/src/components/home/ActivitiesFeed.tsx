"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, ImageIcon, Loader2, MessageCircle, RefreshCw, Sparkles, UserRound } from "lucide-react";
import Image from "@/components/ui/PublicMediaImage";
import LikeButton from "@/components/engagement/LikeButton";
import PostViewerModal from "@/components/engagement/PostViewerModal";
import api from "@/lib/api";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";

type FeedKind = "all" | "gallery" | "service";
interface Provider { id: number; display_name?: string | null; avatar_url?: string | null; headline?: string | null }
interface FeedBase { id: string; created_at?: string; likes_count?: number; comments_count?: number; provider?: Provider }
type FeedItem = FeedBase & (
    { type: "gallery"; data: { id: number; image_url: string; caption?: string | null } }
    | { type: "service"; data: { id: number; title: string; description: string; banner_url?: string | null; price_label?: string | null } }
);
const PAGE_SIZE = 20;
const filters: Array<{ id: FeedKind; label: string }> = [
    { id: "all", label: "همه" }, { id: "gallery", label: "پست‌ها" }, { id: "service", label: "خدمات" },
];

export default function ActivitiesFeed() {
    const [kind, setKind] = useState<FeedKind>("all");
    return (
        <section className="mt-6" aria-label="فعالیت‌های کاربران">
            <div className="flex gap-2" aria-label="نوع فعالیت">
                {filters.map(filter => (
                    <button key={filter.id} type="button" aria-pressed={kind === filter.id} onClick={() => setKind(filter.id)}
                        className={cn("min-h-10 rounded-full border px-5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6]", kind === filter.id ? "border-[#155aa6] bg-[#155aa6] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                        {filter.label}
                    </button>
                ))}
            </div>
            <FeedResults key={kind} kind={kind} />
        </section>
    );
}

function FeedResults({ kind }: { kind: FeedKind }) {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const offset = useRef(0);
    const retryOffset = useRef(0);
    const request = useRef<AbortController | null>(null);
    const load = useCallback(async (skip = 0) => {
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setLoading(true);
        setError(false);
        retryOffset.current = skip;
        try {
            const { data } = await api.get<FeedItem[]>("/feed", {
                params: { limit: PAGE_SIZE, skip, ...(kind !== "all" ? { kind } : {}) },
                chinverseCacheTtlMs: 0, signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            setItems(previous => skip === 0 ? data : [...previous, ...data.filter(item => !previous.some(old => old.id === item.id))]);
            offset.current = skip + data.length;
            setHasMore(data.length === PAGE_SIZE);
        } catch {
            if (!controller.signal.aborted) setError(true);
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [kind]);

    useEffect(() => {
        void load();
        return () => request.current?.abort();
    }, [load]);

    return (
        <div className="mt-4" aria-busy={loading}>
            <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>جدیدترین‌ها</span>
                <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[#155aa6] disabled:opacity-50">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تازه‌سازی
                </button>
            </div>
            {items.length === 0 && loading ? (
                <div className="space-y-4" role="status" aria-label="در حال دریافت فعالیت‌ها">
                    {[0, 1].map(index => <div key={index} className="h-72 animate-pulse rounded-3xl bg-slate-100" />)}
                </div>
            ) : null}
            {error ? (
                <div role="alert" className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center">
                    <h3 className="text-sm font-bold text-slate-900">فعالیت‌ها دریافت نشد</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-600">اتصال را بررسی کن و دوباره تلاش کن.</p>
                    <button type="button" disabled={loading} onClick={() => void load(retryOffset.current)} className="mt-3 rounded-xl bg-[#155aa6] px-5 py-2.5 text-xs font-bold text-white">تلاش دوباره</button>
                </div>
            ) : null}
            {!loading && !error && items.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center">
                    <Sparkles size={32} className="mx-auto text-[#155aa6]" />
                    <h3 className="mt-4 text-base font-black text-slate-900">هنوز فعالیتی ثبت نشده</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-500">{kind === "service" ? "خدمات تازهٔ کاربران اینجا نمایش داده می‌شوند." : kind === "gallery" ? "پست‌های تازهٔ کاربران اینجا نمایش داده می‌شوند." : "با انتشار پست یا خدمت، فعالیت‌های کاربران اینجا نمایش داده می‌شوند."}</p>
                </div>
            ) : null}
            <div className="space-y-5">
                {items.map(item => item.type === "service" ? <ServiceCard key={item.id} item={item} /> : <GalleryCard key={item.id} item={item} />)}
            </div>
            {hasMore && !error ? (
                <button type="button" disabled={loading} onClick={() => void load(offset.current)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#d5e1ef] bg-white text-sm font-bold text-[#155aa6] disabled:opacity-60">
                    {loading ? <Loader2 size={17} className="animate-spin" /> : null} نمایش بیشتر
                </button>
            ) : null}
        </div>
    );
}

const cardClass = "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.04)]";

function Author({ item }: { item: FeedItem }) {
    const provider = item.provider;
    const name = provider?.display_name || "کاربر چین‌ورس";
    const content = <>
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[#eef6ff]">
            <AuthorAvatar src={provider?.avatar_url} name={name} />
        </div>
        <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{name}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{provider?.headline || "عضو جامعهٔ چین‌ورس"}</p></div>
    </>;
    return (
        <header className="flex items-center justify-between gap-3 p-4">
            {provider?.id ? <Link href={`/users/${provider.id}`} className="flex min-w-0 items-center gap-2.5" aria-label={`پروفایل ${name}`}>{content}</Link> : <div className="flex min-w-0 items-center gap-2.5">{content}</div>}
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#eef6ff] px-2.5 py-1.5 text-[10px] font-bold text-[#155aa6]">
                {item.type === "service" ? <BriefcaseBusiness size={12} /> : <ImageIcon size={12} />}{item.type === "service" ? "خدمت" : "پست"}
            </span>
        </header>
    );
}

function AuthorAvatar({ src, name }: { src?: string | null; name: string }) {
    const [failedSource, setFailedSource] = useState<string | null>(null);
    return src && failedSource !== src
        ? <Image src={getMediaUrl(src)} alt={name} fill sizes="44px" className="object-cover" onError={() => setFailedSource(src)} />
        : <UserRound size={21} className="text-[#155aa6]" />;
}

function PublishedDate({ value }: { value?: string }) {
    if (!value || Number.isNaN(Date.parse(value))) return null;
    return <time dateTime={value} className="text-[10px] text-slate-400">{new Date(value).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" })}</time>;
}

function ServiceCard({ item }: { item: Extract<FeedItem, { type: "service" }> }) {
    const service = item.data;
    return (
        <article className={cardClass} aria-label={`خدمت: ${service.title}`}>
            <Author item={item} />
            {service.banner_url ? <Link href={`/services/${service.id}`} className="relative mx-3 block aspect-video overflow-hidden rounded-2xl bg-slate-50" aria-label={`جزئیات ${service.title}`}>
                <Image src={getMediaUrl(service.banner_url)} alt={service.title} fill sizes="(max-width: 430px) 90vw, 374px" className="object-contain" />
            </Link> : null}
            <div className="p-4">
                <Link href={`/services/${service.id}`}><h3 className="break-words text-base font-black leading-7 text-slate-950">{service.title}</h3></Link>
                <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-[13px] leading-7 text-slate-600" dir="auto">{service.description}</p>
                {service.price_label ? <p className="mt-3 inline-block rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{service.price_label}</p> : null}
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <Link href={`/services/${service.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#155aa6] px-4 text-xs font-bold text-white">مشاهدهٔ خدمت <ArrowLeft size={15} /></Link>
                    <LikeButton targetType="service" targetId={service.id} initialCount={item.likes_count || 0} compact />
                </div>
                <div className="mt-2 text-left"><PublishedDate value={item.created_at} /></div>
            </div>
        </article>
    );
}

function GalleryCard({ item }: { item: Extract<FeedItem, { type: "gallery" }> }) {
    const gallery = item.data;
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);
    const [open, setOpen] = useState(false);
    return (
        <>
            <article className={cardClass} aria-label={`پست ${item.provider?.display_name || "کاربر چین‌ورس"}`}>
                <Author item={item} />
                <button type="button" onClick={() => setOpen(true)} className="relative block aspect-square w-full bg-slate-50" aria-label="باز کردن پست">
                    <Image src={getMediaUrl(gallery.image_url)} alt={gallery.caption || "تصویر پست"} fill sizes="(max-width: 430px) 92vw, 398px" className="object-contain" />
                </button>
                <div className="p-4">
                    {gallery.caption ? <p className="line-clamp-4 whitespace-pre-line break-words text-[13px] leading-7 text-slate-700" dir="auto">{gallery.caption}</p> : null}
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <LikeButton targetType="post" targetId={gallery.id} initialCount={item.likes_count || 0} compact />
                            <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-xs text-slate-500" aria-label="دیدگاه‌های پست"><MessageCircle size={17} />{commentsCount.toLocaleString("fa-IR")}</button>
                        </div>
                        <PublishedDate value={item.created_at} />
                    </div>
                </div>
            </article>
            {open ? <PostViewerModal isOpen={open} onClose={() => setOpen(false)} post={{ ...gallery, created_at: item.created_at, likes_count: item.likes_count, comments_count: commentsCount, provider: item.provider }} onCommentCountChange={setCommentsCount} /> : null}
        </>
    );
}
