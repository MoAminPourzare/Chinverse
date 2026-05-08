'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BadgeCheck,
    BriefcaseBusiness,
    GraduationCap,
    ImageIcon,
    MapPin,
    MessageCircle,
    Search,
    Sparkles,
    User as UserIcon,
    Users,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { ServiceWithProvider, ShowcaseUser, userService } from "@/services/user.service";

type TabType = "talents" | "services";

const tabs: Array<{ id: TabType; label: string; helper: string }> = [
    { id: "talents", label: "ویترین استعدادها", helper: "زبان‌آموزها و متخصص‌ها" },
    { id: "services", label: "ویترین خدمات", helper: "مشاوره، آموزش و همکاری" },
];

export default function ShowcasePage() {
    const [activeTab, setActiveTab] = useState<TabType>("talents");
    const [users, setUsers] = useState<ShowcaseUser[]>([]);
    const [services, setServices] = useState<ServiceWithProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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
        if (!query) return users;
        return users.filter((user) =>
            [
                user.display_name,
                user.headline,
                user.city,
                user.country,
                user.hsk_level,
                user.education?.university,
                user.education?.field,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        );
    }, [searchQuery, users]);

    const filteredServices = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return services;
        return services.filter((service) =>
            [
                service.title,
                service.description,
                service.price_label,
                service.provider?.display_name,
                service.provider?.headline,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        );
    }, [searchQuery, services]);

    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
                <Surface className="overflow-hidden bg-slate-950 text-white">
                    <div className="relative p-5 sm:p-7">
                        <div className="absolute -left-10 -top-16 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl" />
                        <div className="absolute -bottom-20 right-16 h-52 w-52 rounded-full bg-amber-400/20 blur-3xl" />
                        <div className="relative grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                                    <Sparkles size={15} />
                                    جامعه چین‌ورس
                                </div>
                                <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
                                    ویترین زبان‌آموزها و خدمات چینی
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                                    پروفایل‌ها، نمونه‌کارها و خدمات مرتبط با زبان و فرهنگ چینی اینجا کنار هم دیده می‌شوند.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <MiniMetric label="استعدادها" value={users.length || "—"} />
                                <MiniMetric label="خدمات" value={services.length || "—"} tone="gold" />
                            </div>
                        </div>
                    </div>
                </Surface>

                <Surface className="p-3">
                    <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
                        <div className="grid grid-cols-2 gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "rounded-[22px] px-4 py-3 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400",
                                        activeTab === tab.id
                                            ? "bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-[0_14px_30px_rgba(244,63,94,0.22)]"
                                            : "bg-white/70 text-slate-500 hover:bg-white hover:text-slate-800",
                                    )}
                                >
                                    <span className="block text-sm font-bold">{tab.label}</span>
                                    <span className={cn("mt-1 block text-[11px]", activeTab === tab.id ? "text-white/75" : "text-slate-400")}>
                                        {tab.helper}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <Search className="h-5 w-5 text-slate-400" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={activeTab === "talents" ? "جست‌وجو بین استعدادها..." : "جست‌وجو بین خدمات..."}
                                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </Surface>

                {loading ? (
                    <ShowcaseSkeleton activeTab={activeTab} />
                ) : activeTab === "talents" ? (
                    filteredUsers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredUsers.map((user) => (
                                <TalentCard key={user.id} user={user} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={<Users size={30} />}
                            title="هنوز کاربری برای نمایش وجود ندارد"
                            description="وقتی کاربرها پروفایل، رزومه یا گالری خود را کامل کنند، اینجا نمایش داده می‌شوند."
                        />
                    )
                ) : filteredServices.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            </main>
        </div>
    );
}

function MiniMetric({ label, value, tone = "rose" }: { label: string; value: number | string; tone?: "rose" | "gold" }) {
    return (
        <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-[11px] font-semibold text-white/60">{label}</p>
            <p className={cn("mt-2 text-2xl font-black", tone === "gold" ? "text-amber-200" : "text-rose-100")}>{value}</p>
        </div>
    );
}

interface TalentCardProps {
    user: ShowcaseUser;
}

function TalentCard({ user }: TalentCardProps) {
    const galleryImages = user.gallery_preview.slice(0, 3);

    return (
        <Surface as="article" className="group overflow-hidden p-4 transition duration-200 hover:-translate-y-0.5">
            <div className="grid gap-4 sm:grid-cols-[116px_1fr]">
                <div className="grid h-32 grid-cols-2 gap-1 overflow-hidden rounded-[22px] bg-slate-100">
                    {galleryImages.length > 0 ? (
                        <>
                            <GalleryPreview image={galleryImages[0]} className="row-span-2 h-full" />
                            <GalleryPreview image={galleryImages[1]} />
                            <GalleryPreview image={galleryImages[2]} />
                        </>
                    ) : (
                        <>
                            <FallbackTile label="汉" className="row-span-2" />
                            <FallbackTile label="语" tone="jade" />
                            <FallbackTile label="学" tone="gold" />
                        </>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex items-start gap-3">
                        <Avatar src={user.avatar_url} name={user.display_name} />
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-bold text-slate-950">
                                {user.display_name || "کاربر چین‌ورس"}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-rose-600">
                                {user.headline || "زبان‌آموز یا متخصص زبان چینی"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-500">
                        {(user.city || user.country) && (
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-slate-400" />
                                <span className="truncate">{[user.city, user.country].filter(Boolean).join("، ")}</span>
                            </div>
                        )}
                        {user.education?.university && (
                            <div className="flex items-center gap-2">
                                <GraduationCap size={14} className="text-slate-400" />
                                <span className="truncate">{user.education.university}</span>
                            </div>
                        )}
                        {user.hsk_level && (
                            <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                                <BadgeCheck size={13} />
                                {user.hsk_level}
                            </div>
                        )}
                    </div>

                    <Link
                        href={`/users/${user.id}`}
                        className="mt-4 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                    >
                        مشاهده پروفایل
                    </Link>
                </div>
            </div>
        </Surface>
    );
}

function GalleryPreview({ image, className }: { image?: string; className?: string }) {
    if (!image) {
        return <FallbackTile label="文" tone="muted" className={className} />;
    }

    return (
        <div className={cn("relative min-h-0 bg-slate-100", className)}>
            <Image
                src={getMediaUrl(image)}
                alt="نمونه گالری"
                fill
                className="object-cover"
                sizes="120px"
                unoptimized
            />
        </div>
    );
}

function FallbackTile({
    label,
    tone = "rose",
    className,
}: {
    label: string;
    tone?: "rose" | "jade" | "gold" | "muted";
    className?: string;
}) {
    const tones = {
        rose: "from-rose-100 to-orange-100 text-rose-500",
        jade: "from-emerald-100 to-teal-100 text-emerald-600",
        gold: "from-amber-100 to-yellow-100 text-amber-600",
        muted: "from-slate-100 to-slate-200 text-slate-400",
    };

    return (
        <div className={cn("flex items-center justify-center bg-gradient-to-br text-2xl font-black", tones[tone], className)}>
            {label}
        </div>
    );
}

interface ServiceCardProps {
    service: ServiceWithProvider;
}

function ServiceCard({ service }: ServiceCardProps) {
    return (
        <Surface as="article" className="group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5">
            <div className="relative h-44 bg-gradient-to-br from-slate-100 to-rose-50">
                {service.banner_url ? (
                    <Image
                        src={getMediaUrl(service.banner_url)}
                        alt={service.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-rose-300">
                        <ImageIcon size={44} />
                    </div>
                )}
                {service.price_label && (
                    <span className="absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
                        {service.price_label}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-black tracking-tight text-slate-950">{service.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {service.description}
                </p>

                {service.provider && (
                    <div className="mt-5 flex items-center gap-3 rounded-[20px] bg-slate-50 p-3">
                        <Avatar src={service.provider.avatar_url} name={service.provider.display_name} size="sm" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">
                                {service.provider.display_name || "کاربر چین‌ورس"}
                            </p>
                            {service.provider.headline && (
                                <p className="mt-0.5 truncate text-xs text-slate-500">{service.provider.headline}</p>
                            )}
                        </div>
                    </div>
                )}

                <PrimaryButton
                    href={`/chat/${service.provider?.id || 0}`}
                    className="mt-5 w-full"
                    leadingIcon={<MessageCircle size={18} />}
                >
                    درخواست مشاوره
                </PrimaryButton>
            </div>
        </Surface>
    );
}

function Avatar({ src, name, size = "md" }: { src?: string | null; name?: string | null; size?: "sm" | "md" }) {
    return (
        <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100", size === "sm" ? "h-11 w-11" : "h-12 w-12")}>
            {src ? (
                <Image
                    src={getMediaUrl(src)}
                    alt={name || "کاربر"}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                />
            ) : (
                <UserIcon size={size === "sm" ? 18 : 21} className="text-slate-400" />
            )}
        </div>
    );
}

function ShowcaseSkeleton({ activeTab }: { activeTab: TabType }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: activeTab === "talents" ? 6 : 3 }).map((_, index) => (
                <Surface key={index} className="h-56 animate-pulse p-4">
                    <div className="h-full rounded-[22px] bg-slate-100" />
                </Surface>
            ))}
        </div>
    );
}
