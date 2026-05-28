'use client';

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Settings, BookmarkCheck, BookOpen, Compass, MessageCircle, User as UserIcon, PenLine, Globe, FileText, Briefcase, GraduationCap, Wrench, Languages, LogIn, UserPlus, LogOut, X, Info, Trash2, ImageIcon, Camera, Loader2, SlidersHorizontal, Award, type LucideIcon } from "lucide-react";
import { userService, User } from "@/services/user.service";
import GalleryTab from "@/components/gallery/GalleryTab";
import ServicesTab from "@/components/profile/ServicesTab";
import ImageAdjustModal from "@/components/ui/ImageAdjustModal";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getSocialLinkRel, getSocialLinkTarget, getSocialPlatform, getSocialProfileUrl } from "@/lib/socialLinks";
import { Course, fetchSavedCourses, getCourseDetailHref, getDisplayCount, getLessonCount, unsaveCourse } from "@/lib/courses";
import NotificationBellLink from "@/components/notifications/NotificationBellLink";
import { validateImageFile } from "@/validation";

const EditAboutMeModal = dynamic(() => import("@/components/profile/EditAboutMeModal"), {
    ssr: false,
});
const EditResumeModal = dynamic(() => import("@/components/profile/EditResumeModal"), {
    ssr: false,
});

interface Tab {
    id: string;
    label: string;
    helper: string;
    icon: LucideIcon;
}

const tabs: Tab[] = [
    { id: "about", label: "درباره من", helper: "معرفی", icon: UserIcon },
    { id: "collections", label: "مجموعه‌های منتخب", helper: "آرشیو", icon: Globe },
    { id: "resume", label: "رزومه", helper: "سوابق", icon: FileText },
    { id: "gallery", label: "گالری", helper: "تصاویر", icon: ImageIcon },
    { id: "services", label: "خدمات", helper: "همکاری", icon: Briefcase },
];

const profileAssets = {
    logo: "/assets/chinverse/logos/chinverse-logo.png",
    about: "/assets/chinverse/icons/about-me.svg",
    resume: "/assets/chinverse/icons/cv-light.svg",
    gallery: "/assets/chinverse/icons/photo.svg",
    services: "/assets/chinverse/icons/services.svg",
    collections: "/assets/chinverse/icons/pin.svg",
    location: "/assets/chinverse/icons/location.svg",
    people: "/assets/chinverse/icons/people.svg",
};

export default function ProfilePage() {
    const router = useRouter();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const tabScrollRef = useRef<HTMLDivElement>(null);
    const tabDragRef = useRef({ isDragging: false, startX: 0, startScrollLeft: 0 });
    const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
    const [user, setUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [resumeEditSection, setResumeEditSection] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [avatarError, setAvatarError] = useState("");
    const [followersCount, setFollowersCount] = useState<number>(0);
    const displayName = user?.profile?.display_name?.trim() || user?.email?.split("@")[0] || "کاربر";
    const headline = user?.profile?.headline?.trim();
    const locationParts = [user?.profile?.city?.trim(), user?.profile?.country?.trim()].filter(Boolean);

    const openResumeEditor = (section?: string) => {
        setResumeEditSection(section ?? null);
        setIsResumeModalOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const handleTabDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
        const container = tabScrollRef.current;
        if (!container) return;
        const target = event.target as HTMLElement;

        if (target.closest("button")) return;

        tabDragRef.current = {
            isDragging: true,
            startX: event.clientX,
            startScrollLeft: container.scrollLeft,
        };
        container.setPointerCapture(event.pointerId);
    };

    const handleTabDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const container = tabScrollRef.current;
        if (!container || !tabDragRef.current.isDragging) return;

        const deltaX = event.clientX - tabDragRef.current.startX;
        container.scrollLeft = tabDragRef.current.startScrollLeft - deltaX;
    };

    const handleTabDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        tabDragRef.current.isDragging = false;
        tabScrollRef.current?.releasePointerCapture(event.pointerId);
    };

    const scrollProfileTabs = (direction: "left" | "right") => {
        const container = tabScrollRef.current;
        if (!container) return;

        const delta = direction === "left" ? -150 : 150;
        container.scrollBy({ left: delta, behavior: "smooth" });
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'آیا مطمئن هستید؟ با حذف حساب کاربری، تمام اطلاعات شما (رزومه، گالری، چت‌ها) برای همیشه پاک خواهد شد.'
        );

        if (confirmed) {
            try {
                const api = (await import('@/lib/api')).default;
                await api.delete('/users/me');
                localStorage.removeItem('token');
                router.push('/login');
            } catch (error) {
                console.error('Failed to delete account:', error);
                alert('خطا در حذف حساب کاربری. لطفا دوباره تلاش کنید.');
            }
        }
    };

    const fetchUser = async () => {
        try {
            const data = await userService.getMe();
            setUser(data);

            // Fetch followers and following counts
            const followers = await userService.getMyFollowersCount();
            setFollowersCount(followers);
        } catch (error) {
            console.error("Failed to fetch user", error);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file || isUploadingAvatar) return;

        const validation = validateImageFile(file, { maxMb: 5 });
        if (!validation.ok) {
            setAvatarError(validation.message);
            return;
        }

        setAvatarError("");
        setPendingAvatarFile(file);
    };

    const handleAdjustedAvatar = async (file: File) => {
        setPendingAvatarFile(null);
        setIsUploadingAvatar(true);
        try {
            const updatedUser = await userService.uploadAvatar(file);
            setUser(updatedUser);
        } catch (error) {
            console.error("Failed to upload avatar", error);
            setAvatarError("آپلود عکس انجام نشد. لطفا دوباره امتحان کن.");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const renderTabContent = () => {
        if (activeTab === "about") {
            const hasBio = user?.profile?.bio;
            const hasWebsites = user?.profile?.websites && user.profile.websites.length > 0;
            const hasSocials = user?.profile?.socials && user.profile.socials.length > 0;
            const isEmpty = !hasBio && !hasWebsites && !hasSocials;

            if (isEmpty) {
                return (
                    <ProfileEmptyState
                        asset={profileAssets.about}
                        title="یه معرفی کوتاه درباره خودت بنویس!"
                        description="با نوشتن یک معرفی کوتاه، به بقیه نشون بده کی هستی و به چه حوزه‌هایی علاقه داری. میتونی لینک وبسایت یا شبکه‌هات رو هم اینجا بذاری."
                        actionLabel="ویرایش درباره من"
                        actionIcon={<PenLine className="h-5 w-5" />}
                        onAction={() => setIsEditModalOpen(true)}
                    />
                );
            }

            return (
                <div className="p-6 relative">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="absolute left-4 top-4 rounded-2xl p-2 text-[#155aa6] transition-colors hover:bg-[#eef6ff]"
                    >
                        <PenLine className="w-5 h-5" />
                    </button>

                    {user?.profile?.bio && (
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 mb-3 text-lg">درباره من</h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {user.profile.bio}
                            </p>
                        </div>
                    )}

                    {(user?.profile?.websites?.length ?? 0) > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                وبسایت‌ها
                            </h3>
                            <div className="flex flex-col gap-2">
                                {user?.profile?.websites?.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="dir-ltr truncate text-left text-sm text-[#155aa6] hover:underline">
                                        {url}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {(user?.profile?.socials?.length ?? 0) > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 text-sm">شبکه‌های اجتماعی</h3>
                            <div className="grid gap-2">
                                {user?.profile?.socials?.map((social, idx) => {
                                    const platform = getSocialPlatform(social.platform);
                                    const Icon = platform.icon;
                                    const href = getSocialProfileUrl(social.platform, social.handle);
                                    const target = getSocialLinkTarget(social.platform);
                                    const rel = getSocialLinkRel(social.platform);
                                    return (
                                        <a
                                            key={idx}
                                            href={href}
                                            target={target}
                                            rel={rel}
                                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-[#d5e1ef] hover:bg-[#eef6ff] hover:text-[#155aa6]"
                                        >
                                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#155aa6] shadow-sm">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0 flex-1 text-right font-bold">{platform.name}</span>
                                            <span className="dir-ltr truncate text-left text-xs text-slate-500">{social.handle}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === "resume") {
            const resume = user?.profile?.resume;
            const isEmpty = !resume || Object.values(resume).every((arr) => !arr || arr.length === 0);

            if (isEmpty) {
                return (
                    <ProfileEmptyState
                        asset={profileAssets.resume}
                        title="رزومه‌ات رو ثبت کن!"
                        description="با افزودن مهارت‌ها، سوابق و مدارک، رزومه‌ات در بخش ویترین برای دیگران نمایش داده میشه و شانس همکاری یا پروژه بیشتر میشه."
                        actionLabel="ثبت رزومه"
                        actionIcon={<PenLine className="h-5 w-5" />}
                        onAction={() => openResumeEditor()}
                    />
                );
            }

            const resumeSections = [
                {
                    id: "work",
                    title: "سوابق کاری",
                    icon: Briefcase,
                    items: resume.work_experiences?.map((work) => ({
                        title: work.job_title || work.company,
                        subtitle: work.company,
                        meta: formatResumeDateRange(work.start_date, work.end_date),
                    })) || [],
                },
                {
                    id: "education",
                    title: "تحصیلات",
                    icon: GraduationCap,
                    items: resume.educations?.map((edu) => ({
                        title: edu.university,
                        subtitle: [edu.degree, edu.field].filter(Boolean).join("، "),
                        meta: formatResumeDateRange(edu.start_date, edu.end_date),
                    })) || [],
                },
                {
                    id: "certificates",
                    title: "گواهینامه‌ها",
                    icon: FileText,
                    items: resume.certificates?.map((certificate) => ({
                        title: certificate.title,
                        subtitle: certificate.issuer,
                        meta: certificate.date,
                    })) || [],
                },
                {
                    id: "awards",
                    title: "جوایز و تقدیرنامه‌ها",
                    icon: Award,
                    items: resume.awards?.map((award) => ({
                        title: award.title,
                        subtitle: award.issuer,
                        meta: award.date,
                    })) || [],
                },
                {
                    id: "skills",
                    title: "مهارت‌ها",
                    icon: Wrench,
                    items: resume.skills?.map((skill) => ({
                        title: skill.name,
                        subtitle: skill.level,
                        meta: "",
                    })) || [],
                },
                {
                    id: "languages",
                    title: "زبان‌ها",
                    icon: Languages,
                    items: resume.languages?.map((language) => ({
                        title: language.name,
                        subtitle: language.level,
                        meta: "",
                    })) || [],
                },
            ].filter((section) => section.items.length > 0);

            return (
                <div className="space-y-4 px-5 pb-6 pt-4">
                    {resumeSections.map((section) => (
                        <ResumePreviewCard
                            key={section.id}
                            title={section.title}
                            icon={section.icon}
                            items={section.items}
                            onEdit={() => openResumeEditor(section.id)}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={() => openResumeEditor()}
                        className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-full bg-[#155aa6] px-6 py-3 text-[13px] font-black text-white shadow-[0_10px_22px_rgba(21,90,166,0.28)] transition hover:-translate-y-0.5 hover:bg-[#0f4e92]"
                    >
                        <PenLine className="h-4 w-4" />
                        <span>ویرایش کامل رزومه</span>
                    </button>
                </div>
            );
        }

        if (activeTab === "gallery") {
            return <GalleryTab />;
        }

        if (activeTab === "services") {
            return <ServicesTab />;
        }

        if (activeTab === "collections") {
            return <SavedCoursesTab />;
        }

        const tab = tabs.find((t) => t.id === activeTab);
        return (
            <div className="p-8 text-center text-gray-500">
                محتوای بخش {tab?.label}
            </div>
        );
    };

    return (
        <div className="min-h-full bg-[#f6f7f9] pb-8" dir="rtl">
            <div className="mx-auto flex w-full max-w-[430px] flex-col">
                <header className="sticky top-0 z-50 flex h-[70px] items-center justify-between border-b border-[#dfe3ea] bg-[#eef0f3] px-5">
                    <div className="flex items-center gap-3">
                        <Link href="/community" className="flex h-9 w-9 items-center justify-center rounded-full text-[#242833] transition hover:bg-white" aria-label="گفتگو">
                            <MessageCircle className="h-5 w-5" strokeWidth={1.9} />
                        </Link>
                        <NotificationBellLink />
                        <Link href="/settings" className="flex h-9 w-9 items-center justify-center rounded-full text-[#242833] transition hover:bg-white" aria-label="تنظیمات">
                            <Settings className="h-5 w-5" strokeWidth={1.9} />
                        </Link>
                    </div>

                    <Link href="/" className="relative block h-11 w-32" aria-label="چین‌ورس">
                        <Image
                            src={profileAssets.logo}
                            alt="لوگوی چین‌ورس"
                            fill
                            sizes="128px"
                            className="object-contain object-left"
                            priority
                        />
                    </Link>
                </header>

                <main className="flex flex-col bg-[#f6f7f9]">
                    <section className="px-5 pb-2 pt-7 text-center">
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarFileChange}
                        />

                        <div className="mx-auto mb-4 flex w-fit justify-center">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    className="group relative h-[92px] w-[92px] overflow-hidden rounded-full border-[3px] border-[#155aa6] bg-white shadow-[0_10px_24px_rgba(21,90,166,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
                                    aria-label="تغییر عکس پروفایل"
                                >
                                    {user?.profile?.avatar_url ? (
                                        <Image
                                            src={getMediaUrl(user.profile.avatar_url)}
                                            alt="عکس پروفایل"
                                            fill
                                            sizes="92px"
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">
                                            <UserIcon className="h-10 w-10" />
                                        </span>
                                    )}
                                    <span className="absolute inset-0 hidden items-center justify-center bg-slate-950/35 text-white group-hover:flex">
                                        {isUploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                                    </span>
                                </button>
                            </div>
                        </div>
                        {avatarError && (
                            <p className="mx-auto mb-3 max-w-[280px] rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-bold leading-6 text-rose-600">
                                {avatarError}
                            </p>
                        )}

                        <h1 className="text-[21px] font-black leading-8 text-[#25272d]">
                            {displayName}
                        </h1>

                        {headline && (
                            <p className="mt-1 text-[18px] font-medium leading-8 text-[#25272d]">
                                {headline}
                            </p>
                        )}

                        <div className="mt-2 flex items-center justify-center gap-2 text-[12px] font-medium text-[#7a808c]">
                            <Link href="/profile/network" className="inline-flex items-center gap-1 text-[#155aa6]">
                                <span className="font-latin text-sm font-bold">{followersCount}</span>
                                <Image src={profileAssets.people} alt="" width={18} height={18} />
                            </Link>
                            {locationParts.length > 0 && (
                                <>
                                    <span>{locationParts.join("، ")}</span>
                                    <Image src={profileAssets.location} alt="" width={18} height={18} />
                                </>
                            )}
                        </div>
                    </section>

                    <nav className="relative mt-2 border-b border-[#c8cdd5] px-2">
                        <button
                            type="button"
                            onClick={() => scrollProfileTabs("right")}
                            onPointerDown={(event) => event.stopPropagation()}
                            className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-[#155aa6] shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition hover:bg-[#eef6ff]"
                            aria-label="نمایش سربرگ‌های بعدی"
                        >
                            <span className="text-lg leading-none">‹</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollProfileTabs("left")}
                            onPointerDown={(event) => event.stopPropagation()}
                            className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-[#155aa6] shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition hover:bg-[#eef6ff]"
                            aria-label="نمایش سربرگ‌های قبلی"
                        >
                            <span className="text-lg leading-none">›</span>
                        </button>
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-12 bg-gradient-to-l from-[#f6f7f9] to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-12 bg-gradient-to-r from-[#f6f7f9] to-transparent" />
                        <div
                            ref={tabScrollRef}
                            className="no-scrollbar flex cursor-grab select-none items-end gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-10 active:cursor-grabbing"
                            dir="rtl"
                            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                            onPointerDown={handleTabDragStart}
                            onPointerMove={handleTabDragMove}
                            onPointerUp={handleTabDragEnd}
                            onPointerCancel={handleTabDragEnd}
                            onMouseLeave={() => {
                                tabDragRef.current.isDragging = false;
                            }}
                        >
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onPointerDown={(event) => event.stopPropagation()}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "relative shrink-0 rounded-t-2xl px-4 py-3 text-center text-[14px] font-bold leading-5 transition",
                                            isActive
                                                ? "bg-white text-[#155aa6] shadow-[0_-2px_14px_rgba(21,90,166,0.08)]"
                                                : "text-[#2f3238] hover:bg-white/60 hover:text-[#155aa6]",
                                        )}
                                        style={{ scrollSnapAlign: "center" }}
                                    >
                                        <span className="block whitespace-nowrap">{tab.label}</span>
                                        <span
                                            className={cn(
                                                "absolute inset-x-2 -bottom-px h-[2px] rounded-full transition",
                                                isActive ? "bg-[#155aa6]" : "bg-transparent",
                                            )}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    <section className="min-h-[370px] bg-[#f6f7f9]">
                        {renderTabContent()}
                    </section>
                </main>

                <EditAboutMeModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    user={user}
                    onUpdate={fetchUser}
                />

                <EditResumeModal
                    isOpen={isResumeModalOpen}
                    onClose={() => {
                        setIsResumeModalOpen(false);
                        setResumeEditSection(null);
                    }}
                    user={user}
                    onUpdate={fetchUser}
                    initialSection={resumeEditSection}
                />

                <ImageAdjustModal
                    file={pendingAvatarFile}
                    isOpen={!!pendingAvatarFile}
                    title="تنظیم عکس پروفایل"
                    aspectRatio={1}
                    frameClassName="rounded-full"
                    onCancel={() => setPendingAvatarFile(null)}
                    onConfirm={(file) => void handleAdjustedAvatar(file)}
                />

                {/* Settings Modal */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
                        <div
                            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[30px] border border-white/70 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)] animate-in slide-in-from-bottom duration-300"
                            onClick={(e) => e.stopPropagation()}
                            dir="rtl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900">تنظیمات</h2>
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {/* 1. حساب کاربری */}
                                <Link
                                    href="/account"
                                    className="flex items-center gap-3 rounded-2xl p-4 transition hover:bg-slate-50"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-[#155aa6]" />
                                    </div>
                                    <span className="font-medium text-gray-800">حساب کاربری</span>
                                </Link>

                                <Link
                                    href="/settings"
                                    className="flex items-center gap-3 rounded-2xl p-4 transition hover:bg-blue-50"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                        <SlidersHorizontal className="w-5 h-5 text-blue-700" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block font-medium text-gray-800">تنظیمات دلخواه</span>
                                    </div>
                                </Link>

                                {/* 2. درباره چین‌ورس */}
                                <Link
                                    href="/settings/about"
                                    className="flex items-center gap-3 rounded-2xl p-4 transition hover:bg-slate-50"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Info className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <span className="font-medium text-gray-800">درباره چین‌ورس</span>
                                </Link>

                                {/* 3. ورود */}
                                <Link
                                    href="/login"
                                    className="flex items-center gap-3 rounded-2xl p-4 transition hover:bg-slate-50"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <LogIn className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="font-medium text-gray-800">ورود</span>
                                </Link>

                                {/* 4. ثبت نام */}
                                <Link
                                    href="/signup"
                                    className="flex items-center gap-3 rounded-2xl p-4 transition hover:bg-slate-50"
                                    onClick={() => setIsSettingsOpen(false)}
                                >
                                    <div className="w-10 h-10 bg-[#eef6ff] rounded-full flex items-center justify-center">
                                        <UserPlus className="w-5 h-5 text-[#155aa6]" />
                                    </div>
                                    <span className="font-medium text-gray-800">ثبت نام</span>
                                </Link>

                                {/* 5. خروج */}
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 rounded-2xl p-4 transition hover:bg-[#eef6ff]"
                                >
                                    <div className="w-10 h-10 bg-[#eef6ff] rounded-full flex items-center justify-center">
                                        <LogOut className="w-5 h-5 text-[#155aa6]" />
                                    </div>
                                    <span className="font-medium text-gray-800">خروج</span>
                                </button>

                                {/* 6. حذف حساب کاربری */}
                                <button
                                    onClick={() => { setIsSettingsOpen(false); handleDeleteAccount(); }}
                                    className="flex w-full items-center gap-3 rounded-2xl p-4 transition hover:bg-red-50"
                                >
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                    </div>
                                    <span className="font-medium text-red-600">حذف حساب کاربری</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ResumePreviewCard({
    title,
    icon: Icon,
    items,
    onEdit,
}: {
    title: string;
    icon: LucideIcon;
    items: Array<{ title?: string; subtitle?: string; meta?: string }>;
    onEdit: () => void;
}) {
    const visibleItems = items.slice(0, 2);
    const hasMore = items.length > visibleItems.length;

    return (
        <section className="rounded-[12px] border border-[#d4d8df] bg-[#e1e4ea] px-4 py-3 text-right shadow-[0_5px_12px_rgba(15,23,42,0.14)]">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[#155aa6]">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-lg p-1.5 transition hover:bg-white/70"
                        aria-label={`ویرایش ${title}`}
                    >
                        <PenLine className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <h3 className="text-[19px] font-black leading-7 text-[#25272d]">{title}</h3>
                    <Icon className="h-5 w-5 text-[#155aa6]" strokeWidth={1.9} />
                </div>
            </div>

            <div className="divide-y divide-[#c4c8d0]">
                {visibleItems.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="py-2">
                        <p className="truncate text-right text-[12px] font-black leading-5 text-[#2f3238]">
                            {item.title || "بدون عنوان"}
                        </p>
                        {item.subtitle && (
                            <p className="mt-0.5 truncate text-right text-[10.5px] font-semibold leading-5 text-[#555c68]">
                                {item.subtitle}
                            </p>
                        )}
                        {item.meta && (
                            <p className="mt-0.5 text-right text-[10px] font-medium leading-4 text-[#7d8490]">
                                {item.meta}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    type="button"
                    onClick={onEdit}
                    className="mt-1 flex w-full items-center justify-center gap-2 border-t border-[#c4c8d0] pt-2 text-[12px] font-black text-[#25272d]"
                >
                    <span>نشان دادن همه</span>
                    <span aria-hidden>←</span>
                </button>
            )}
        </section>
    );
}

function formatResumeDateRange(start?: string, end?: string) {
    const cleanStart = start?.trim();
    const cleanEnd = end?.trim();
    if (cleanStart && cleanEnd) return `${cleanStart} - ${cleanEnd}`;
    return cleanStart || cleanEnd || "";
}

function ProfileEmptyState({
    asset,
    title,
    description,
    actionLabel,
    actionIcon,
    onAction,
}: {
    asset: string;
    title: string;
    description: string;
    actionLabel: string;
    actionIcon: ReactNode;
    onAction: () => void;
}) {
    return (
        <div className="flex min-h-[360px] flex-col items-center justify-start px-8 pb-8 pt-8 text-center">
            <div className="relative mb-6 h-[96px] w-[96px]">
                <Image
                    src={asset}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-contain"
                />
            </div>
            <h3 className="text-[18px] font-black leading-8 text-[#25272d]">
                {title}
            </h3>
            <p className="mt-3 max-w-[300px] text-[12px] font-medium leading-7 text-[#888e99]">
                {description}
            </p>
            <button
                type="button"
                onClick={onAction}
                className="mt-7 flex h-[54px] w-[54px] items-center justify-center rounded-[14px] bg-[#155aa6] text-white shadow-[0_12px_24px_rgba(21,90,166,0.34)] transition hover:-translate-y-0.5 hover:bg-[#0f4e92] focus:outline-none focus:ring-4 focus:ring-[#155aa6]/20"
                aria-label={actionLabel}
            >
                {actionIcon}
            </button>
        </div>
    );
}

function SavedCoursesTab() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadSavedCourses = async () => {
            setLoading(true);
            setError(false);

            try {
                const data = await fetchSavedCourses();
                if (!cancelled) {
                    setCourses(data);
                }
            } catch (loadError) {
                console.error("Failed to fetch saved courses:", loadError);
                if (!cancelled) {
                    setCourses([]);
                    setError(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadSavedCourses();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleRemoveCourse = async (courseId: number) => {
        if (removingId) return;
        if (!window.confirm("این دوره از مجموعه‌های منتخب حذف شود؟")) return;

        setRemovingId(courseId);
        try {
            await unsaveCourse(courseId);
            setCourses((currentCourses) => currentCourses.filter((course) => course.id !== courseId));
        } catch (removeError) {
            console.error("Failed to remove saved course:", removeError);
            alert("حذف این دوره از منتخب‌ها انجام نشد. دوباره تلاش کن.");
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[260px] items-center justify-center p-8 text-sm text-slate-500">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-[#155aa6]" />
                    <span>در حال بارگذاری منتخب‌ها...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#eef6ff] text-[#155aa6]">
                    <BookmarkCheck className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-black text-slate-900">منتخب‌ها بارگذاری نشد</h3>
                <p className="mt-2 max-w-xs text-sm leading-7 text-slate-500">
                    اتصال به سرور یا حساب کاربری را بررسی کن و دوباره وارد پروفایل شو.
                </p>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="flex min-h-[360px] flex-col items-center justify-start px-8 pb-8 pt-8 text-center">
                <div className="relative mb-6 h-[104px] w-[104px]">
                    <Image
                        src={profileAssets.collections}
                        alt=""
                        fill
                        sizes="104px"
                        className="object-contain"
                    />
                </div>

                <h3 className="text-[18px] font-black leading-8 text-[#25272d]">اولین مجموعه‌ات رو انتخاب کن!</h3>
                <p className="mt-3 max-w-[300px] text-[12px] font-medium leading-7 text-[#888e99]">
                    به عالمه محتوای خفن منتظره. فقط کافیه یکیو انتخاب کنی و بذاری توی علاقه‌مندی‌هات.
                </p>

                <Link
                    href="/explore"
                    className="mt-7 inline-flex items-center gap-2 rounded-[14px] bg-[#155aa6] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(21,90,166,0.34)] transition hover:-translate-y-0.5 hover:bg-[#0f4e92]"
                >
                    <Compass className="h-4 w-4" />
                    کاوش کن
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 sm:p-5">
            <div className="space-y-3">
                {courses.map((course) => {
                    const href = getCourseDetailHref(course);
                    const lessonsCount = getLessonCount(course);
                    const countText = lessonsCount > 0
                        ? `${lessonsCount} درس`
                        : getDisplayCount(course, ["lesson_count", "episodes_count", "tracks_count"], "بخش");

                    return (
                        <div
                            key={course.id}
                            className="flex gap-3 rounded-[26px] border border-slate-100 bg-slate-50/80 p-3 transition hover:bg-white hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
                        >
                            <Link href={href} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-slate-100">
                                {course.cover_image_url ? (
                                    <Image
                                        src={course.cover_image_url}
                                        alt={course.title}
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#155aa6] to-[#0f4e92] text-white">
                                        <BookOpen className="h-7 w-7" />
                                    </div>
                                )}
                            </Link>

                            <div className="min-w-0 flex-1">
                                <Link href={href} className="block">
                                    <h4 className="line-clamp-1 text-sm font-black text-slate-950">{course.title}</h4>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{course.description}</p>
                                </Link>

                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
                                        {countText}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCourse(course.id)}
                                            disabled={removingId === course.id}
                                            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            aria-label="حذف از منتخب‌ها"
                                        >
                                            {removingId === course.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
