"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    Briefcase,
    Camera,
    Heart,
    Headphones,
    ImageIcon,
    Loader2,
    MessageCircle,
    RefreshCw,
    Sparkles,
    User as UserIcon,
    Users,
} from "lucide-react";
import api from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import Surface from "@/components/ui/Surface";
import PrimaryButton from "@/components/ui/PrimaryButton";

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
    data: GalleryData | ServiceData;
    provider?: FeedProvider;
}

export default function HomePage() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFeed = async (mode: "initial" | "refresh" = "initial") => {
        if (mode === "initial") {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        try {
            const response = await api.get<FeedItem[]>("/feed");
            setFeedItems(response.data);
        } catch (error) {
            console.error("Failed to fetch feed", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadFeed();
    }, []);

    const galleryCount = useMemo(() => feedItems.filter((item) => item.type === "gallery").length, [feedItems]);
    const serviceCount = useMemo(() => feedItems.filter((item) => item.type === "service").length, [feedItems]);

    return (
        <div className="min-h-full bg-[#f7f8fb] pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-[34px] border border-slate-900 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.20)]">
                    <div className="relative p-5 sm:p-6">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(244,63,94,0.32),transparent_34%),radial-gradient(circle_at_88%_10%,rgba(251,191,36,0.24),transparent_30%),linear-gradient(135deg,#0f172a_0%,#312033_52%,#111827_100%)]" />
                        <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-rose-400/20 blur-3xl" />
                        <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-white/78">
                                        <Sparkles size={13} />
                                        ChinVerse Social
                                    </div>
                                    <h1 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
                                        ویترین تازه‌های چین‌ورس
                                    </h1>
                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                                        عکس‌ها، خدمات، فعالیت‌ها و پروفایل‌های تازه کاربران را یک‌جا ببین؛ خانه حالا بیشتر شبیه فید اجتماعی چین‌ورس است.
                                    </p>
                                </div>
                                <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-white/15 bg-white/[0.12] text-amber-100 shadow-inner sm:flex">
                                    <Users size={30} />
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-2">
                                <SocialStat icon={<Sparkles size={16} />} label="کل فعالیت" value={feedItems.length} />
                                <SocialStat icon={<ImageIcon size={16} />} label="گالری" value={galleryCount} />
                                <SocialStat icon={<Briefcase size={16} />} label="خدمات" value={serviceCount} />
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex justify-end">
                        <button
                            type="button"
                            onClick={() => loadFeed("refresh")}
                            disabled={refreshing}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                            تازه‌سازی
                        </button>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                                <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                                <span>در حال بارگذاری فید...</span>
                            </div>
                        </div>
                    ) : feedItems.length > 0 ? (
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                            <div className="space-y-4">
                                {feedItems.map((item) =>
                                    item.type === "service" ? (
                                        <ServiceFeedCard key={item.id} item={item} />
                                    ) : (
                                        <GalleryFeedCard key={item.id} item={item} />
                                    ),
                                )}
                            </div>
                            <aside className="hidden space-y-4 lg:block">
                                <Surface className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-rose-50 text-rose-600">
                                            <Heart size={21} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-950">چین‌ورس زنده است</h3>
                                            <p className="mt-1 text-xs leading-6 text-slate-500">
                                                اینجا جای نمایش فعالیت‌های کاربران، خدمات، گالری و ارتباطات اجتماعی است.
                                            </p>
                                        </div>
                                    </div>
                                </Surface>
                                <Surface className="p-5">
                                    <h3 className="text-sm font-black text-slate-950">میانبرهای اجتماعی</h3>
                                    <div className="mt-4 grid gap-2">
                                        <SocialShortcut href="/showcase" icon={<Camera size={17} />} label="ویترین استعدادها" />
                                        <SocialShortcut href="/services" icon={<Briefcase size={17} />} label="ویترین خدمات" />
                                        <SocialShortcut href="/community" icon={<MessageCircle size={17} />} label="تالار گفتگو" />
                                    </div>
                                </Surface>
                            </aside>
                        </div>
                    ) : (
                        <Surface className="p-10 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-100 text-slate-400">
                                <Sparkles size={28} />
                            </div>
                            <h2 className="mt-5 text-lg font-black text-slate-950">هنوز فعالیتی ثبت نشده</h2>
                            <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-slate-500">
                                وقتی کاربران گالری یا خدمات جدید اضافه کنند، اینجا مثل یک فید اجتماعی نمایش داده می‌شود.
                            </p>
                        </Surface>
                    )}
                </section>
            </main>
        </div>
    );
}

function SocialStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="rounded-[22px] border border-white/15 bg-white/[0.10] px-3 py-3 text-center">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-2xl bg-white/15 text-amber-100">
                {icon}
            </div>
            <p className="mt-2 text-[10px] font-bold text-white/55">{label}</p>
            <p className="mt-0.5 text-lg font-black text-white">{toPersianDigits(value)}</p>
        </div>
    );
}

function ServiceFeedCard({ item }: { item: FeedItem }) {
    const service = item.data as ServiceData;
    const provider = item.provider;

    return (
        <Surface className="overflow-hidden border-white bg-white/95">
            <div className="p-4">
                <PostAuthor provider={provider} createdAt={item.created_at} badge="خدمت" />

                <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
                    <Link href={`/services/${service.id}`} className="relative min-h-40 overflow-hidden rounded-[24px] bg-slate-100">
                        {service.banner_url ? (
                            <Image
                                src={getMediaUrl(service.banner_url)}
                                alt={service.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="flex h-full min-h-40 items-center justify-center bg-[linear-gradient(135deg,#fff7ed_0%,#ffe4e6_100%)] text-rose-300">
                                <Briefcase size={34} />
                            </div>
                        )}
                    </Link>

                    <div className="min-w-0">
                        <Link href={`/services/${service.id}`}>
                            <h3 className="text-lg font-black tracking-tight text-slate-950">{service.title}</h3>
                        </Link>
                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-500">{service.description}</p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            {service.price_label ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                    {service.price_label}
                                </span>
                            ) : (
                                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">
                                    آماده مشاوره
                                </span>
                            )}
                            <PrimaryButton
                                href={`/chat/${provider?.id || 0}`}
                                variant="primary"
                                className="px-4 py-2.5"
                                leadingIcon={<Headphones size={16} />}
                            >
                                درخواست مشاوره
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>
        </Surface>
    );
}

function GalleryFeedCard({ item }: { item: FeedItem }) {
    const gallery = item.data as GalleryData;
    const provider = item.provider;

    return (
        <Surface className="overflow-hidden border-white bg-white/95">
            <div className="p-4">
                <PostAuthor provider={provider} createdAt={item.created_at} badge="گالری" />

                <Link href="/showcase" className="relative mt-4 block aspect-[4/3] overflow-hidden rounded-[26px] bg-slate-100">
                    <Image
                        src={getMediaUrl(gallery.image_url)}
                        alt={gallery.caption || "Gallery image"}
                        fill
                        className="object-cover transition duration-300 hover:scale-[1.02]"
                        unoptimized
                    />
                </Link>

                {gallery.caption && <p className="mt-4 text-sm leading-7 text-slate-600">{gallery.caption}</p>}

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                        <Heart size={15} />
                        الهام‌بخش
                    </span>
                    <Link href="/showcase" className="text-rose-600 transition hover:text-rose-700">
                        دیدن ویترین
                    </Link>
                </div>
            </div>
        </Surface>
    );
}

function PostAuthor({ provider, createdAt, badge }: { provider?: FeedProvider; createdAt?: string; badge: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[19px] bg-slate-100">
                {provider?.avatar_url ? (
                    <Image
                        src={getMediaUrl(provider.avatar_url)}
                        alt={provider.display_name || "User"}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                    />
                ) : (
                    <UserIcon className="h-5 w-5 text-slate-400" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-950">
                        {provider?.display_name || "کاربر چین‌ورس"}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{badge}</span>
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                    {provider?.headline || "عضو جامعه چین‌ورس"}
                    {createdAt ? ` • ${new Date(createdAt).toLocaleDateString("fa-IR")}` : ""}
                </p>
            </div>
        </div>
    );
}

function SocialShortcut({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between rounded-[20px] border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-black text-slate-700 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
        >
            <span className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
                    {icon}
                </span>
                {label}
            </span>
            <span className="text-slate-300">‹</span>
        </Link>
    );
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
