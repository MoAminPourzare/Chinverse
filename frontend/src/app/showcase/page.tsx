"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BriefcaseBusiness,
    Check,
    ChevronLeft,
    GraduationCap,
    ImageIcon,
    Landmark,
    MapPin,
    MessageCircle,
    Search,
    SlidersHorizontal,
    Tag,
    User as UserIcon,
    Users,
    X,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import LikeButton from "@/components/engagement/LikeButton";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps, getTextAlign } from "@/lib/textDirection";
import {
    EDUCATION_DEGREE_OPTIONS,
    LOCATION_FILTER_OPTIONS,
    PROFILE_HEADLINE_OPTIONS,
    UNIVERSITY_OPTIONS,
} from "@/profileOptions";
import { ServiceWithProvider, ShowcaseUser, userService } from "@/services/user.service";

type TabType = "talents" | "services";
type FilterKey = "jobTitles" | "locations" | "degrees" | "universities";

type TalentFilters = Record<FilterKey, string[]>;

const tabs: Array<{ id: TabType; label: string }> = [
    { id: "talents", label: "ویترین استعدادها" },
    { id: "services", label: "ویترین خدمات" },
];

const filterOrder: FilterKey[] = ["jobTitles", "locations", "degrees", "universities"];

const filterConfig: Record<FilterKey, {
    label: string;
    helper: string;
    icon: typeof Tag;
    options: string[];
}> = {
    jobTitles: {
        label: "عنوان شغلی",
        helper: "می‌توانی چند عنوان را انتخاب کنی",
        icon: Tag,
        options: PROFILE_HEADLINE_OPTIONS,
    },
    locations: {
        label: "لوکیشن",
        helper: "کشور یا استان ایران را انتخاب کن",
        icon: MapPin,
        options: LOCATION_FILTER_OPTIONS,
    },
    degrees: {
        label: "مقطع تحصیلی",
        helper: "سطح تحصیلات ثبت شده در رزومه",
        icon: GraduationCap,
        options: EDUCATION_DEGREE_OPTIONS,
    },
    universities: {
        label: "دانشگاه محل تحصیل",
        helper: "دانشگاه یا موسسه آموزشی رزومه",
        icon: Landmark,
        options: UNIVERSITY_OPTIONS,
    },
};

function createEmptyFilters(): TalentFilters {
    return {
        jobTitles: [],
        locations: [],
        degrees: [],
        universities: [],
    };
}

export default function ShowcasePage() {
    const [activeTab, setActiveTab] = useState<TabType>("talents");
    const [users, setUsers] = useState<ShowcaseUser[]>([]);
    const [services, setServices] = useState<ServiceWithProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilterKey, setActiveFilterKey] = useState<FilterKey | null>(null);
    const [talentFilters, setTalentFilters] = useState<TalentFilters>(() => createEmptyFilters());

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
        void fetchData();
    }, [activeTab]);

    const activeFilterCount = useMemo(
        () => Object.values(talentFilters).reduce((count, values) => count + values.length, 0),
        [talentFilters],
    );

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return users.filter((user) => {
            if (!matchesAnyJobTitle(user, talentFilters.jobTitles)) return false;
            if (!matchesAnyLocation(user, talentFilters.locations)) return false;
            if (!matchesValue(user.education?.degree, talentFilters.degrees)) return false;
            if (!matchesValue(user.education?.university, talentFilters.universities)) return false;

            if (!query) return true;

            return [
                user.display_name,
                user.headline,
                ...(user.job_titles || []),
                user.city,
                user.country,
                user.hsk_level,
                user.education?.university,
                user.education?.field,
                user.education?.degree,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [searchQuery, talentFilters, users]);

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

    const resetFilters = () => {
        setTalentFilters(createEmptyFilters());
        setActiveFilterKey(null);
    };

    const handleToggleFilterValue = (filterKey: FilterKey, value: string) => {
        setTalentFilters((current) => {
            const values = current[filterKey];
            const nextValues = values.includes(value)
                ? values.filter((item) => item !== value)
                : [...values, value];
            return { ...current, [filterKey]: nextValues };
        });
    };

    const handleTabChange = (tabId: TabType) => {
        setActiveTab(tabId);
        setSearchQuery("");
        setIsFilterOpen(false);
        setActiveFilterKey(null);
        setTalentFilters(createEmptyFilters());
    };

    return (
        <div className="min-h-full bg-[#f7f8fa] px-4 pb-24 pt-6" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col">
                <header className="space-y-3">
                    <div className="rounded-[24px] border border-white/80 bg-[#e7ebf1] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_22px_rgba(15,23,42,0.06)]">
                        <div className="grid grid-cols-2 gap-1.5">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "relative h-[48px] rounded-[18px] px-2 text-center text-[14px] font-black transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#155aa6]/12",
                                        activeTab === tab.id
                                            ? "bg-white text-[#155aa6] shadow-[0_10px_22px_rgba(21,90,166,0.13)]"
                                            : "text-[#2f3238] hover:bg-white/55 hover:text-[#155aa6]",
                                    )}
                                >
                                    <span className="block truncate">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-2">
                        <label className="flex h-12 min-w-0 items-center gap-2 rounded-[18px] border border-white/70 bg-[#e2e5eb] px-4 text-slate-700 transition-all duration-300 focus-within:border-[#155aa6]/25 focus-within:bg-white focus-within:text-[#155aa6] focus-within:shadow-[0_10px_22px_rgba(21,90,166,0.10)] focus-within:ring-4 focus-within:ring-[#155aa6]/10">
                            <Search size={18} className="shrink-0" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={searchPlaceholder}
                                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-500 transition hover:bg-white hover:text-[#155aa6]"
                                    aria-label="پاک کردن جستجو"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </label>

                        {activeTab === "talents" && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFilterOpen(true);
                                    setActiveFilterKey(null);
                                }}
                                className={cn(
                                    "relative flex h-12 min-w-[104px] items-center justify-center gap-2 rounded-[18px] border px-4 text-sm font-black transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#155aa6]/12",
                                    activeFilterCount > 0
                                        ? "border-[#155aa6] bg-[#155aa6] text-white shadow-[0_12px_24px_rgba(21,90,166,0.24)]"
                                        : "border-white/70 bg-[#e2e5eb] text-slate-700 hover:bg-[#dbe3ee]",
                                )}
                                aria-label="فیلترها"
                            >
                                <SlidersHorizontal size={18} />
                                <span>{activeFilterCount > 0 ? `${toPersianDigits(activeFilterCount)} فیلتر` : "فیلتر"}</span>
                                {activeFilterCount > 0 && (
                                    <span className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#ffb74d]" />
                                )}
                            </button>
                        )}
                    </div>
                </header>

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
                                title="کاربری برای نمایش پیدا نشد"
                                description="فیلترها یا عبارت جستجو را تغییر بده تا افراد بیشتری دیده شوند."
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

            {isFilterOpen && (
                <TalentFilterPanel
                    activeFilterKey={activeFilterKey}
                    filters={talentFilters}
                    activeFilterCount={activeFilterCount}
                    onBack={() => activeFilterKey ? setActiveFilterKey(null) : setIsFilterOpen(false)}
                    onClose={() => {
                        setActiveFilterKey(null);
                        setIsFilterOpen(false);
                    }}
                    onOpenFilter={setActiveFilterKey}
                    onToggleValue={handleToggleFilterValue}
                    onClearAll={resetFilters}
                    onClearFilter={(filterKey) => setTalentFilters((current) => ({ ...current, [filterKey]: [] }))}
                />
            )}
        </div>
    );
}

function TalentFilterPanel({
    activeFilterKey,
    filters,
    activeFilterCount,
    onBack,
    onClose,
    onOpenFilter,
    onToggleValue,
    onClearAll,
    onClearFilter,
}: {
    activeFilterKey: FilterKey | null;
    filters: TalentFilters;
    activeFilterCount: number;
    onBack: () => void;
    onClose: () => void;
    onOpenFilter: (key: FilterKey) => void;
    onToggleValue: (key: FilterKey, value: string) => void;
    onClearAll: () => void;
    onClearFilter: (key: FilterKey) => void;
}) {
    const currentConfig = activeFilterKey ? filterConfig[activeFilterKey] : null;

    return (
        <div className="modal-backdrop-motion fixed inset-0 z-[120] bg-[#f7f8fa] px-5 pb-24 pt-5" dir="rtl">
            <div className="mx-auto flex h-full w-full max-w-[430px] flex-col">
                <header className="grid h-12 grid-cols-[44px_1fr_44px] items-center">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white"
                        aria-label="بازگشت"
                    >
                        <ChevronLeft className="h-5 w-5 rotate-180" />
                    </button>
                    <h2 className="text-center text-[18px] font-black text-[#25272d]">
                        {currentConfig?.label || "فیلترها"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900"
                        aria-label="بستن"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                {!activeFilterKey ? (
                    <>
                        <div className="mt-8 space-y-1">
                            {filterOrder.map((filterKey) => {
                                const config = filterConfig[filterKey];
                                const Icon = config.icon;
                                const selectedValues = filters[filterKey];
                                return (
                                    <button
                                        key={filterKey}
                                        type="button"
                                        onClick={() => onOpenFilter(filterKey)}
                                        className="flex min-h-[56px] w-full items-center gap-3 border-b border-slate-300/80 py-2 text-right transition hover:bg-white/70"
                                    >
                                        <ChevronLeft className="h-5 w-5 shrink-0 text-slate-700" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[15px] font-black text-[#25272d]">{config.label}</p>
                                            {selectedValues.length > 0 && (
                                                <p className="mt-0.5 truncate text-[11px] font-bold text-[#155aa6]">
                                                    {selectedValues.slice(0, 2).join("، ")}
                                                    {selectedValues.length > 2 ? ` +${toPersianDigits(selectedValues.length - 2)}` : ""}
                                                </p>
                                            )}
                                        </div>
                                        <Icon className="h-6 w-6 shrink-0 text-[#155aa6]" strokeWidth={1.7} />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-auto flex gap-3 pt-6">
                            <button
                                type="button"
                                onClick={onClearAll}
                                disabled={activeFilterCount === 0}
                                className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                پاک کردن
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-12 flex-1 rounded-2xl bg-[#155aa6] text-sm font-black text-white shadow-[0_12px_24px_rgba(21,90,166,0.24)] transition hover:bg-[#0f4e92]"
                            >
                                اعمال فیلتر
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="mt-5 flex min-h-0 flex-1 flex-col">
                        <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                            <p className="text-sm font-black text-slate-900">{currentConfig?.label}</p>
                            <p className="mt-1 text-xs font-semibold leading-6 text-slate-500">{currentConfig?.helper}</p>
                        </div>

                        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-[24px] bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                            <button
                                type="button"
                                onClick={() => onClearFilter(activeFilterKey)}
                                className={cn(
                                    "mb-2 flex min-h-11 w-full items-center justify-center rounded-[16px] border px-3 text-center text-sm font-black transition",
                                    filters[activeFilterKey].length === 0
                                        ? "border-[#155aa6] bg-[#155aa6] text-white"
                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-[#eef6ff] hover:text-[#155aa6]",
                                )}
                            >
                                همه موارد
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                {filterConfig[activeFilterKey].options.map((option) => {
                                    const active = filters[activeFilterKey].includes(option);
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => onToggleValue(activeFilterKey, option)}
                                            className={cn(
                                                "flex min-h-12 items-center justify-center gap-1.5 rounded-[16px] border px-3 py-2 text-center text-[12px] font-black leading-5 transition-all duration-200",
                                                active
                                                    ? "border-[#155aa6] bg-[#155aa6] text-white shadow-[0_10px_20px_rgba(21,90,166,0.22)]"
                                                    : "border-[#dbe5f0] bg-[#f8fbff] text-slate-600 hover:border-[#155aa6]/30 hover:bg-[#eef6ff] hover:text-[#155aa6]",
                                            )}
                                        >
                                            {active && <Check size={14} />}
                                            <span className="line-clamp-2">{option}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TalentCard({ user }: { user: ShowcaseUser }) {
    const galleryImages = user.gallery_preview.slice(0, 4);
    const location = [user.city, user.country].filter(Boolean).join("، ");
    const education = [user.education?.university, user.education?.field].filter(Boolean).join(" - ");
    const displayName = user.display_name || "کاربر چین‌ورس";
    const headline = user.headline || user.job_titles?.[0] || "زبان‌آموز یا متخصص زبان چینی";

    return (
        <Link
            href={`/users/${user.id}`}
            className="block rounded-[10px] bg-[#e2e5eb] p-3 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-[#dbe3ee]"
        >
            <article className="grid grid-cols-[112px_1fr] gap-3" dir="ltr">
                <GalleryMosaic images={galleryImages} />

                <div className="min-w-0 text-right" dir="rtl">
                    <div className="grid grid-cols-[52px_1fr] items-center gap-2">
                        <Avatar src={user.avatar_url} name={user.display_name} />
                        <div className="min-w-0 text-center">
                            <h3 className="truncate text-center text-[13px] font-black leading-6 text-slate-950" {...getDirectionalTextProps(displayName)}>
                                {displayName}
                            </h3>
                            <p className="line-clamp-1 text-center text-[11px] font-bold leading-5 text-slate-700" {...getDirectionalTextProps(headline)}>
                                {headline}
                            </p>
                            {location && (
                                <p className="mt-0.5 flex items-center justify-center gap-1 text-center text-[10px] font-medium leading-5 text-slate-500">
                                    <MapPin size={11} className="shrink-0 text-[#155aa6]" />
                                    <span className="truncate" {...getDirectionalTextProps(location)}>{location}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-2 space-y-1 text-[10px] font-medium leading-5 text-slate-500">
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
    const titleProps = getDirectionalTextProps(service.title);
    const descriptionProps = getDirectionalTextProps(service.description);

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
                        <h3 className={cn("line-clamp-2 text-[13px] font-black leading-6 text-slate-950", getTextAlign(service.title))} {...titleProps}>{service.title}</h3>
                    </Link>
                    <p className={cn("mt-1 line-clamp-4 text-[10px] font-medium leading-5 text-slate-700", getTextAlign(service.description))} {...descriptionProps}>
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

function matchesAnyJobTitle(user: ShowcaseUser, selectedJobTitles: string[]) {
    if (selectedJobTitles.length === 0) return true;
    const userTitles = [user.headline, ...(user.job_titles || [])]
        .map((title) => title?.trim())
        .filter(Boolean);
    return selectedJobTitles.some((title) => userTitles.includes(title));
}

function matchesAnyLocation(user: ShowcaseUser, selectedLocations: string[]) {
    if (selectedLocations.length === 0) return true;
    const country = user.country?.trim();
    const city = user.city?.trim();
    const tokens = [
        country,
        city,
        country && city ? `${country} / ${city}` : undefined,
        country && city ? `${city} / ${country}` : undefined,
    ].filter(Boolean);
    return selectedLocations.some((location) => tokens.includes(location));
}

function matchesValue(value: string | undefined, selectedValues: string[]) {
    if (selectedValues.length === 0) return true;
    if (!value) return false;
    return selectedValues.includes(value.trim());
}

function toPersianDigits(value: string | number) {
    const digits = "۰۱۲۳۴۵۶۷۸۹";
    return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
