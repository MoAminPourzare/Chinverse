"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Compass,
    Flame,
    Headphones,
    Loader2,
    Play,
    Sparkles,
    User as UserIcon,
} from "lucide-react";
import api from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import Surface from "@/components/ui/Surface";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import PrimaryButton from "@/components/ui/PrimaryButton";

type TabType = "activities" | "learning";

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

const quickPaths = [
    { title: "HSK", subtitle: "سطح‌ها و درس‌های اصلی", href: "/explore/hsk", accent: "from-rose-500 to-orange-500", icon: BookOpen },
    { title: "تلفظ", subtitle: "صداها و لحن‌ها", href: "/explore/pronunciation", accent: "from-sky-500 to-cyan-500", icon: Play },
    { title: "گرامر", subtitle: "ساختار جمله‌ها", href: "/explore/grammar", accent: "from-emerald-500 to-teal-500", icon: Sparkles },
    { title: "کاوش همه", subtitle: "تمام دسته‌ها", href: "/explore", accent: "from-slate-900 to-slate-600", icon: Compass },
];

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<TabType>("activities");
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            if (activeTab !== "activities") {
                setLoading(false);
                return;
            }

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

        fetchFeed();
    }, [activeTab]);

    const activityCount = feedItems.length;
    const highlightedFeed = useMemo(() => feedItems.slice(0, 3), [feedItems]);

    return (
        <div className="min-h-full pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
                <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#334155_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
                    <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div>
                            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/80">
                                ChinVerse
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                                مسیر یادگیری چینی، تمیزتر و حرفه‌ای‌تر
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                                روی درس بعدی، دسته‌های محبوب و فعالیت‌های تازه تمرکز کن. همه‌چیز در یک داشبورد سبک و منظم کنار هم قرار گرفته.
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <PrimaryButton variant="light" leadingIcon={<Compass size={16} />}>
                                    رفتن به کاوش
                                </PrimaryButton>
                                <PrimaryButton variant="ghost" className="!border-white/15 !bg-white/10 !text-white hover:!bg-white/15" leadingIcon={<Flame size={16} />}>
                                    ادامه یادگیری
                                </PrimaryButton>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            <StatCard
                                label="فعالیت‌های امروز"
                                value={String(activityCount)}
                                helper="آخرین آیتم‌های منتشر شده"
                                icon={<Sparkles className="h-5 w-5" />}
                                accent="from-amber-500 to-orange-500"
                                inverted
                            />
                            <StatCard
                                label="مسیرهای سریع"
                                value="4"
                                helper="موضوعات اصلی برای شروع"
                                icon={<Compass className="h-5 w-5" />}
                                accent="from-emerald-500 to-teal-500"
                                inverted
                            />
                            <StatCard
                                label="حالت مطالعه"
                                value="آماده"
                                helper="برای شروع یک درس تازه"
                                icon={<Play className="h-5 w-5" />}
                                accent="from-rose-500 to-orange-500"
                                inverted
                            />
                        </div>
                    </div>
                </Surface>

                <Surface className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Today</p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">یک هدف سبک برای امروز</h2>
                            <p className="mt-1 text-sm text-slate-500">به‌جای شلوغی، فقط روی یک جلسه کوتاه و یک مسیر مشخص تمرکز کن.</p>
                        </div>
                        <div className="hidden rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 sm:block">
                            20 دقیقه
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">تمرکز</p>
                            <p className="mt-2 text-base font-bold text-slate-900">تلفظ و شنیدن</p>
                            <p className="mt-1 text-xs text-slate-500">برای شروع روز خیلی مناسب است.</p>
                        </div>
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">پیشنهاد</p>
                            <p className="mt-2 text-base font-bold text-slate-900">یک درس کوتاه HSK</p>
                            <p className="mt-1 text-xs text-slate-500">درس‌های مرتب و قابل پیگیری.</p>
                        </div>
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">پیشرفت</p>
                            <ProgressBar value={58} helper="مسیر امروز" className="mt-3" />
                        </div>
                    </div>
                </Surface>

                <section className="space-y-3">
                    <SectionHeader
                        title="مسیرهای سریع"
                        subtitle="برای ورود به بخش‌های اصلی، چند کارت کوتاه و واضح."
                    />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {quickPaths.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.title} href={item.href} className="group">
                                    <Surface className="h-full overflow-hidden p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                                        <div className={`inline-flex rounded-2xl bg-gradient-to-br ${item.accent} p-3 text-white shadow-lg`}>
                                            <Icon size={18} />
                                        </div>
                                        <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.subtitle}</p>
                                    </Surface>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionHeader
                        title="نمای کلی"
                        subtitle="بین فعالیت‌ها و مسیر یادگیری جابه‌جا شو."
                        actionLabel="تازه‌سازی"
                        onAction={() => {
                            if (activeTab === "activities") {
                                setLoading(true);
                                api.get<FeedItem[]>("/feed")
                                    .then((response) => setFeedItems(response.data))
                                    .catch((error) => console.error("Failed to refresh feed", error))
                                    .finally(() => setLoading(false));
                            }
                        }}
                    />

                    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            onClick={() => setActiveTab("activities")}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                activeTab === "activities"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            فعالیت‌ها
                        </button>
                        <button
                            onClick={() => setActiveTab("learning")}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                activeTab === "learning"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            یادگیری
                        </button>
                    </div>

                    {activeTab === "activities" ? (
                        loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {feedItems.map((item) =>
                                    item.type === "service" ? (
                                        <ServiceFeedCard key={item.id} item={item} />
                                    ) : (
                                        <GalleryFeedCard key={item.id} item={item} />
                                    ),
                                )}
                                {feedItems.length === 0 && (
                                    <Surface className="p-8 text-center text-sm text-slate-500">
                                        هنوز فعالیتی ثبت نشده است.
                                    </Surface>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {highlightedFeed.length > 0 ? (
                                highlightedFeed.map((item) =>
                                    item.type === "service" ? (
                                        <ServiceFeedCard key={item.id} item={item} />
                                    ) : (
                                        <GalleryFeedCard key={item.id} item={item} />
                                    ),
                                )
                            ) : (
                                quickPaths.slice(0, 3).map((item) => (
                                    <Link key={item.title} href={item.href}>
                                        <Surface className="h-full p-5">
                                            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                                            <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
                                        </Surface>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

function ServiceFeedCard({ item }: { item: FeedItem }) {
    const service = item.data as ServiceData;
    const provider = item.provider;

    return (
        <Surface className="overflow-hidden">
            <div className="grid gap-4 p-4 sm:grid-cols-[180px_1fr]">
                <div className="relative min-h-44 overflow-hidden rounded-[22px] bg-slate-100">
                    {service.banner_url ? (
                        <Image
                            src={getMediaUrl(service.banner_url)}
                            alt={service.title}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] text-slate-400">
                            <BookOpen size={32} />
                        </div>
                    )}
                </div>

                <div className="flex min-w-0 flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                                {provider?.avatar_url ? (
                                    <Image
                                        src={getMediaUrl(provider.avatar_url)}
                                        alt={provider.display_name || "User"}
                                        width={44}
                                        height={44}
                                        className="h-full w-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <UserIcon className="h-5 w-5 text-slate-400" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                    {provider?.display_name || "کاربر"}
                                </p>
                                {provider?.headline && <p className="truncate text-xs text-slate-500">{provider.headline}</p>}
                            </div>
                        </div>

                        <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{service.title}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-500">{service.description}</p>
                        {service.price_label && (
                            <div className="mt-4 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                                {service.price_label}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            {item.created_at && <span>{new Date(item.created_at).toLocaleDateString("fa-IR")}</span>}
                        </div>
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
        </Surface>
    );
}

function GalleryFeedCard({ item }: { item: FeedItem }) {
    const gallery = item.data as GalleryData;
    const provider = item.provider;

    return (
        <Surface className="overflow-hidden">
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                        {provider?.avatar_url ? (
                            <Image
                                src={getMediaUrl(provider.avatar_url)}
                                alt={provider.display_name || "User"}
                                width={44}
                                height={44}
                                className="h-full w-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <UserIcon className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {provider?.display_name || "کاربر"}
                        </p>
                        {item.created_at && (
                            <p className="text-xs text-slate-400">
                                {new Date(item.created_at).toLocaleDateString("fa-IR")}
                            </p>
                        )}
                    </div>
                </div>

                <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[22px] bg-slate-100">
                    <Image
                        src={getMediaUrl(gallery.image_url)}
                        alt={gallery.caption || "Gallery image"}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>

                {gallery.caption && <p className="mt-4 text-sm leading-7 text-slate-600">{gallery.caption}</p>}
            </div>
        </Surface>
    );
}
