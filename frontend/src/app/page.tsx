"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    ImageIcon,
    MessageCircle,
    Sparkles,
    User as UserIcon,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import LikeButton from "@/components/engagement/LikeButton";
import PostViewerModal from "@/components/engagement/PostViewerModal";
import DailyPracticeContent from "@/components/daily/DailyPracticeContent";

type HomeTab = "activities" | "daily";

const homeTabs: Array<{ id: HomeTab; label: string }> = [
    { id: "activities", label: "فعالیت‌ها" },
    { id: "daily", label: "روند یادگیری" },
];

interface FeedProvider {
    id: number;
    display_name?: string;
    avatar_url?: string;
    headline?: string;
}

interface GalleryData {
    id: number;
    image_url: string;
    caption?: string;
}

interface ServiceData {
    id: number;
    title: string;
    description: string;
    banner_url?: string;
    price_label?: string;
}

interface FeedItem {
    id: string;
    type: "gallery" | "service";
    created_at?: string;
    likes_count?: number;
    comments_count?: number;
    data: GalleryData | ServiceData;
    provider?: FeedProvider;
}

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<HomeTab>("activities");
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFeed = async () => {
        setLoading(true);
        try {
            const response = await api.get<FeedItem[]>("/feed");
            setFeedItems(response.data);
        } catch (error) {
            console.error("Failed to fetch feed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadFeed();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const searchParams = new URLSearchParams(window.location.search);
        const requestedTab = searchParams.get("tab");
        if (requestedTab === "daily" || requestedTab === "activities") {
            setActiveTab(requestedTab);
        }
    }, []);

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-24" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col px-4 pt-4">
                <header className="flex flex-col items-center">
                    <Image
                        src="/assets/chinverse/logos/chinverse-logo.png"
                        alt="چین‌ورس"
                        width={118}
                        height={58}
                        className="h-[58px] w-auto object-contain"
                        priority
                    />

                    <div className="mt-3 grid h-[48px] w-full grid-cols-2 border-b border-[#c8d0dc]">
                        {homeTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative text-center text-[15px] font-black transition focus:outline-none",
                                    activeTab === tab.id ? "text-[#155aa6]" : "text-slate-700",
                                )}
                            >
                                {tab.label}
                                <span
                                    className={cn(
                                        "absolute bottom-[-1px] left-0 right-0 mx-auto h-[3px] w-full rounded-full transition",
                                        activeTab === tab.id ? "bg-[#155aa6] shadow-[0_5px_9px_rgba(21,90,166,0.28)]" : "bg-transparent",
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </header>

                {activeTab === "daily" ? (
                    <section
                        key="daily"
                        className="tab-content-motion mt-5 [&>div]:min-h-0 [&>div]:bg-transparent [&>div]:pb-0 [&_main]:max-w-none [&_main]:px-0 [&_main]:py-0"
                    >
                        <DailyPracticeContent />
                    </section>
                ) : (
                    <ActivitiesFeed
                        items={feedItems}
                        loading={loading}
                    />
                )}
            </main>
        </div>
    );
}

function ActivitiesFeed({
    items,
    loading,
}: {
    items: FeedItem[];
    loading: boolean;
}) {
    if (loading) {
        return (
            <section className="mt-7 space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-[210px] animate-pulse rounded-[10px] bg-[#e2e5eb]" />
                ))}
            </section>
        );
    }

    if (items.length === 0) {
        return (
            <section className="mt-10 rounded-[10px] bg-[#e2e5eb] px-6 py-10 text-center shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#155aa6] shadow-sm">
                    <Sparkles size={28} />
                </div>
                <h2 className="mt-5 text-lg font-black text-slate-900">هنوز فعالیتی ثبت نشده</h2>
            </section>
        );
    }

    return (
        <section className="motion-list mt-5 space-y-4">
            {items.map((item) =>
                item.type === "service" ? (
                    <ServiceFeedCard key={item.id} item={item} />
                ) : (
                    <GalleryFeedCard key={item.id} item={item} />
                ),
            )}
        </section>
    );
}

function ServiceFeedCard({ item }: { item: FeedItem }) {
    const service = item.data as ServiceData;
    const provider = item.provider;

    return (
        <article className="overflow-hidden rounded-[10px] bg-[#dfe2e8] p-3 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
            <PostAuthor provider={provider} />

            <div className="mt-3 grid grid-cols-[128px_1fr] gap-3" dir="ltr">
                <Link href={`/services/${service.id}`} className="relative h-[116px] overflow-hidden rounded-[10px] bg-slate-200">
                    {service.banner_url ? (
                        <Image
                            src={getMediaUrl(service.banner_url)}
                            alt={service.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-[#155aa6]/35">
                            <ImageIcon size={34} />
                        </div>
                    )}
                </Link>

                <div className="min-w-0 text-right" dir="rtl">
                    <Link href={`/services/${service.id}`}>
                        <h3 className="line-clamp-2 text-[13px] font-black leading-6 text-slate-950">{service.title}</h3>
                    </Link>
                    <p className="mt-1 line-clamp-4 text-[10px] font-medium leading-5 text-slate-700">
                        {service.description}
                    </p>
                    <Link href={`/services/${service.id}`} className="text-[10px] font-black text-[#155aa6]">
                        بیشتر
                    </Link>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <LikeButton targetType="service" targetId={service.id} initialCount={item.likes_count || 0} compact />
                {provider?.id ? (
                    <Link
                        href={`/chat/${provider.id}`}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] bg-[#155aa6] px-4 text-xs font-black text-white shadow-[0_6px_12px_rgba(21,90,166,0.25)] transition hover:bg-[#0f4e92]"
                    >
                        <MessageCircle size={15} />
                        درخواست مشاوره
                    </Link>
                ) : null}
            </div>
        </article>
    );
}

function GalleryFeedCard({ item }: { item: FeedItem }) {
    const gallery = item.data as GalleryData;
    const provider = item.provider;
    const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const openViewer = () => setIsViewerOpen(true);

    return (
        <>
        <article className="overflow-hidden rounded-[10px] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.10)]">
            <div className="bg-[#dfe2e8] px-3 py-2">
                <PostAuthor provider={provider} compact />
            </div>

            <button type="button" onClick={openViewer} className="relative block aspect-[1/1.1] w-full bg-slate-100 text-right">
                <Image
                    src={getMediaUrl(gallery.image_url)}
                    alt={gallery.caption || "تصویر پست"}
                    fill
                    className="object-cover transition duration-300 hover:scale-[1.02]"
                    sizes="398px"
                    unoptimized
                />
            </button>

            <div className="px-4 pb-4 pt-3">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-3">
                        <LikeButton targetType="post" targetId={gallery.id} initialCount={item.likes_count || 0} compact />
                        <button type="button" onClick={openViewer} className="inline-flex items-center gap-1.5 transition hover:text-[#155aa6]">
                            <MessageCircle size={17} />
                            {toPersianDigits(commentsCount)}
                        </button>
                    </div>
                    {item.created_at ? <span>تاریخ انتشار: {formatDate(item.created_at)}</span> : null}
                </div>

                {gallery.caption && (
                    <button type="button" onClick={openViewer} className="mt-3 block w-full text-right text-[13px] font-medium leading-7 text-slate-700">
                        {gallery.caption}
                    </button>
                )}

            </div>
        </article>
        <PostViewerModal
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
            post={{
                ...gallery,
                created_at: item.created_at,
                likes_count: item.likes_count,
                comments_count: commentsCount,
                provider,
            }}
            onCommentCountChange={setCommentsCount}
        />
        </>
    );
}

function PostAuthor({
    provider,
    compact = false,
}: {
    provider?: FeedProvider;
    compact?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3" dir="ltr">
            <span className="h-1 w-1" aria-hidden />
            <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 text-right" dir="rtl">
                    <p className={cn("truncate font-black text-slate-900", compact ? "text-xs" : "text-[13px]")}>
                        {provider?.display_name || "کاربر چین‌ورس"}
                    </p>
                    {!compact && (
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                            {provider?.headline || "عضو جامعه چین‌ورس"}
                        </p>
                    )}
                </div>
                <Avatar src={provider?.avatar_url} name={provider?.display_name} compact={compact} />
            </div>
        </div>
    );
}

function Avatar({ src, name, compact = false }: { src?: string | null; name?: string | null; compact?: boolean }) {
    return (
        <div
            className={cn(
                "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#155aa6] bg-white shadow-sm",
                compact ? "h-[42px] w-[42px]" : "h-[48px] w-[48px]",
            )}
        >
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || "کاربر"}
                    fill
                    className="object-cover"
                    sizes={compact ? "42px" : "48px"}
                    unoptimized
                />
            ) : (
                <UserIcon size={compact ? 18 : 21} className="text-slate-400" />
            )}
        </div>
    );
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("fa-IR");
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
