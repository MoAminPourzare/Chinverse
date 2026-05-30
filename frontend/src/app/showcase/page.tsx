"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BriefcaseBusiness,
    ImageIcon,
    MapPin,
    MessageCircle,
    Search,
    SlidersHorizontal,
    User as UserIcon,
    Users,
    X,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import LikeButton from "@/components/engagement/LikeButton";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { PROFILE_HEADLINE_OPTIONS } from "@/profileOptions";
import { ServiceWithProvider, ShowcaseUser, userService } from "@/services/user.service";

type TabType = "talents" | "services";

const tabs: Array<{ id: TabType; label: string }> = [
    { id: "talents", label: "ویترین استعدادها" },
    { id: "services", label: "ویترین خدمات" },
];

export default function ShowcasePage() {
    const [activeTab, setActiveTab] = useState<TabType>("talents");
    const [users, setUsers] = useState<ShowcaseUser[]>([]);
    const [services, setServices] = useState<ServiceWithProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedHeadline, setSelectedHeadline] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === "talents") {
                    const data = await userService.getShowcaseUsers();
                    setUsers(data);
                } else {
                    const data = await userService.getPublicServices();
                    setServices(data);
                }
            } catch (error) {
                console.error("Failed to fetch showcase data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return users.filter((user) => {
            const matchesHeadline = !selectedHeadline || user.headline?.trim() === selectedHeadline;
            if (!matchesHeadline) return false;
            if (!query) return true;

            return [
                user.display_name,
                user.headline,
                user.city,
                user.country,
                user.hsk_level,
                user.education?.university,
                user.education?.field,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [searchQuery, selectedHeadline, users]);

    const filteredServices = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return services;

        return services.filter((service) =>
            [
                service.title,
                service.description,
                service.provider?.display_name,
                service.provider?.headline,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        );
    }, [searchQuery, services]);

    const searchPlaceholder = activeTab === "talents" ? "جستجو بین استعدادها..." : "جستجو بین خدمات...";

    return (
        <div className="min-h-full bg-[#f7f8fa] px-4 pb-24 pt-6" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col">
                <header className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setIsSearchOpen((value) => !value)}
                        className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-[#e2e5eb] text-slate-700 transition hover:bg-[#dbe3ee] focus:outline-none focus:ring-4 focus:ring-[#155aa6]/15"
                        aria-label="جستجو"
                    >
                        {isSearchOpen ? <X size={22} /> : <Search size={23} />}
                    </button>

                    {activeTab === "talents" && (
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen((value) => !value)}
                            className={cn(
                                "relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full transition focus:outline-none focus:ring-4 focus:ring-[#155aa6]/15",
                                isFilterOpen || selectedHeadline
                                    ? "bg-[#155aa6] text-white shadow-[0_10px_22px_rgba(21,90,166,0.24)]"
                                    : "bg-[#e2e5eb] text-slate-700 hover:bg-[#dbe3ee]",
                            )}
                            aria-label="فیلتر شغل"
                        >
                            <SlidersHorizontal size={22} />
                            {selectedHeadline && (
                                <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#ffb74d]" />
                            )}
                        </button>
                    )}

                    <div className="grid min-w-0 flex-1 grid-cols-2 items-end gap-3">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSearchQuery("");
                                    setSelectedHeadline("");
                                    setIsFilterOpen(false);
                                }}
                                className={cn(
                                    "relative h-[54px] px-1 text-center text-[15px] font-black transition focus:outline-none",
                                    activeTab === tab.id ? "text-[#155aa6]" : "text-[#2f3238]",
                                )}
                            >
                                <span className="block truncate">{tab.label}</span>
                                <span
                                    className={cn(
                                        "absolute bottom-1 left-2 right-2 h-[2px] rounded-full transition",
                                        activeTab === tab.id ? "bg-[#155aa6] shadow-[0_4px_8px_rgba(21,90,166,0.25)]" : "bg-transparent",
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </header>

                {isSearchOpen && (
                    <label className="mt-4 flex h-12 items-center gap-3 rounded-full border border-[#d5e1ef] bg-white px-4 shadow-sm focus-within:border-[#155aa6] focus-within:ring-4 focus-within:ring-[#155aa6]/10">
                        <Search size={18} className="text-slate-400" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                    </label>
                )}

                {activeTab === "talents" && isFilterOpen && (
                    <div className="mt-3 rounded-[24px] border border-[#d5e1ef] bg-white p-3 shadow-[0_12px_26px_rgba(15,23,42,0.06)]">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-black text-slate-950">فیلتر شغل</h2>
                                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">نمایش افراد بر اساس عنوان شغلی</p>
                            </div>
                            {selectedHeadline && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedHeadline("")}
                                    className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-500 transition hover:bg-slate-200"
                                >
                                    پاک کردن
                                </button>
                            )}
                        </div>
                        <select
                            value={selectedHeadline}
                            onChange={(event) => setSelectedHeadline(event.target.value)}
                            className="w-full appearance-none rounded-2xl border border-slate-200 bg-[#f8fbff] px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10"
                        >
                            <option value="">همه شغل‌ها</option>
                            {PROFILE_HEADLINE_OPTIONS.map((headline) => (
                                <option key={headline} value={headline}>
                                    {headline}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <section className="mt-5">
                    {loading ? (
                        <ShowcaseSkeleton activeTab={activeTab} />
                    ) : activeTab === "talents" ? (
                        filteredUsers.length > 0 ? (
                            <div className="motion-list space-y-4">
                                {filteredUsers.map((user) => (
                                    <TalentCard key={user.id} user={user} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<Users size={30} />}
                                title="هنوز کاربری برای نمایش وجود ندارد"
                                description="وقتی کاربران پروفایل، رزومه یا گالری خود را کامل کنند، اینجا نمایش داده می‌شوند."
                            />
                        )
                    ) : filteredServices.length > 0 ? (
                        <div className="motion-list space-y-4">
                            {filteredServices.map((service) => (
                                <ServiceCard key={service.id} service={service} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<BriefcaseBusiness size={30} />}
                            title="هنوز خدمتی ثبت نشده است"
                            description="خدمات عمومی کاربران بعد از ثبت شدن در پروفایل، در این بخش نمایش داده می‌شوند."
                        />
                    )}
                </section>
            </main>
        </div>
    );
}

function TalentCard({ user }: { user: ShowcaseUser }) {
    const galleryImages = user.gallery_preview.slice(0, 4);
    const location = [user.city, user.country].filter(Boolean).join("، ");
    const education = [user.education?.university, user.education?.field].filter(Boolean).join(" - ");

    return (
        <Link
            href={`/users/${user.id}`}
            className="block rounded-[10px] bg-[#e2e5eb] p-3 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-[#dbe3ee]"
        >
            <article className="grid grid-cols-[112px_1fr] gap-3" dir="ltr">
                <GalleryMosaic images={galleryImages} />

                <div className="min-w-0 text-right" dir="rtl">
                    <div className="flex items-start justify-between gap-2">
                        <Avatar src={user.avatar_url} name={user.display_name} />
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[13px] font-black leading-6 text-slate-950">
                                {user.display_name || "کاربر چین‌ورس"}
                            </h3>
                            <p className="line-clamp-2 text-[11px] font-bold leading-5 text-slate-700">
                                {user.headline || "زبان‌آموز یا متخصص زبان چینی"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-2 space-y-1 text-[10px] font-medium leading-5 text-slate-500">
                        {location && (
                            <p className="flex items-center justify-end gap-1">
                                <span className="truncate">{location}</span>
                                <MapPin size={11} className="shrink-0 text-[#155aa6]" />
                            </p>
                        )}
                        {education && (
                            <p className="line-clamp-2">
                                فارغ التحصیل از {education}
                            </p>
                        )}
                        {user.hsk_level && <p>دارای مدرک {user.hsk_level}</p>}
                    </div>
                </div>
            </article>
        </Link>
    );
}

function GalleryMosaic({ images }: { images: string[] }) {
    if (images.length === 0) {
        return (
            <div className="grid h-[112px] w-[112px] grid-cols-2 gap-1.5">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-[10px] bg-slate-300/70" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid h-[112px] w-[112px] grid-cols-2 gap-1.5">
            {Array.from({ length: 4 }).map((_, index) => {
                const image = images[index];
                return (
                    <div key={`${image || "empty"}-${index}`} className="relative overflow-hidden rounded-[10px] bg-slate-300">
                        {image ? (
                            <Image
                                src={getMediaUrl(image)}
                                alt="نمونه گالری"
                                fill
                                className="object-cover"
                                sizes="56px"
                                unoptimized
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function ServiceCard({ service }: { service: ServiceWithProvider }) {
    return (
        <article className="rounded-[10px] bg-[#e2e5eb] p-3 shadow-[0_8px_18px_rgba(15,23,42,0.10)]">
            <div className="grid grid-cols-[128px_1fr] gap-3" dir="ltr">
                <Link href={`/services/${service.id}`} className="relative h-[112px] overflow-hidden rounded-[10px] bg-slate-200">
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
                <LikeButton targetType="service" targetId={service.id} initialCount={service.likes_count || 0} compact />
                {service.provider?.id ? (
                    <Link
                        href={`/chat/${service.provider.id}`}
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

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
    return (
        <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#155aa6] bg-white shadow-sm">
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || "کاربر"}
                    fill
                    className="object-cover"
                    sizes="52px"
                    unoptimized
                />
            ) : (
                <UserIcon size={22} className="text-slate-400" />
            )}
        </div>
    );
}

function ShowcaseSkeleton({ activeTab }: { activeTab: TabType }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: activeTab === "talents" ? 5 : 3 }).map((_, index) => (
                <div key={index} className="h-[138px] animate-pulse rounded-[10px] bg-[#e2e5eb]" />
            ))}
        </div>
    );
}
