'use client';

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, BookmarkCheck, BookOpen, Compass, MessageCircle, MapPin, User as UserIcon, PenLine, Globe, FileText, Briefcase, GraduationCap, Wrench, Languages, LogIn, UserPlus, LogOut, X, Info, Trash2, ImageIcon, Camera, Loader2, PlayCircle, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { userService, User } from "@/services/user.service";
import GalleryTab from "@/components/gallery/GalleryTab";
import ServicesTab from "@/components/profile/ServicesTab";
import ImageAdjustModal from "@/components/ui/ImageAdjustModal";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getSocialPlatform, getSocialProfileUrl } from "@/lib/socialLinks";
import { Course, fetchSavedCourses, getCourseDetailHref, getDisplayCount, getLessonCount, unsaveCourse } from "@/lib/courses";
import NotificationBellLink from "@/components/notifications/NotificationBellLink";

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
    { id: "resume", label: "رزومه", helper: "سوابق", icon: FileText },
    { id: "gallery", label: "گالری", helper: "تصاویر", icon: ImageIcon },
    { id: "services", label: "خدمات", helper: "همکاری", icon: Briefcase },
    { id: "collections", label: "منتخب", helper: "آرشیو", icon: Globe },
];

export default function ProfilePage() {
    const router = useRouter();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
    const [user, setUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [followersCount, setFollowersCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
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
            const [followers, following] = await Promise.all([
                userService.getMyFollowersCount(),
                userService.getMyFollowingCount(),
            ]);
            setFollowersCount(followers);
            setFollowingCount(following);
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

        if (!file.type.startsWith("image/")) {
            alert("لطفا یک فایل تصویری انتخاب کن.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("حجم عکس نباید بیشتر از ۵ مگابایت باشد.");
            return;
        }

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
            alert("آپلود عکس انجام نشد. لطفا دوباره امتحان کن.");
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
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="mb-6 relative">
                            <PenLine className="w-24 h-24 text-rose-200" strokeWidth={1} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            یه معرفی کوتاه درباره خودت بنویس!
                        </h3>
                        <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
                            با نوشتن یک معرفی کوتاه، به بقیه نشون بده کی هستی و به چه حوزه‌هایی علاقه داری. میتونی لینک وبسایت یا شبکه‌هات رو هم اینجا بذاری.
                        </p>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 p-3 text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition hover:from-rose-600 hover:to-orange-600"
                        >
                            <PenLine className="w-6 h-6" />
                        </button>
                    </div>
                );
            }

            return (
                <div className="p-6 relative">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="absolute left-4 top-4 rounded-2xl p-2 text-rose-600 transition-colors hover:bg-rose-50"
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
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="dir-ltr truncate text-left text-sm text-rose-600 hover:underline">
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
                                    return (
                                        <a
                                            key={idx}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
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
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="mb-6 relative">
                            <FileText className="w-24 h-24 text-rose-200" strokeWidth={1} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            رزومه ات رو ثبت کن!
                        </h3>
                        <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
                            با افزودن مهارت‌ها، سوابق و مدارک، رزومه‌ات در بخش ویترین برای دیگران نمایش داده میشه و شانس همکاری یا پروژه بیشتر میشه.
                        </p>
                        <button
                            onClick={() => setIsResumeModalOpen(true)}
                            className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 p-3 text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition hover:from-rose-600 hover:to-orange-600"
                        >
                            <PenLine className="w-6 h-6" />
                        </button>
                    </div>
                );
            }

            return (
                <div className="p-6 relative space-y-8">
                    <button
                        onClick={() => setIsResumeModalOpen(true)}
                        className="absolute left-4 top-4 z-10 rounded-2xl p-2 text-rose-600 transition-colors hover:bg-rose-50"
                    >
                        <PenLine className="w-5 h-5" />
                    </button>

                    {/* Work Experience */}
                    {resume.work_experiences?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-rose-600" />
                                سوابق کاری
                            </h3>
                            <div className="space-y-4 border-r-2 border-gray-100 pr-4">
                                {resume.work_experiences.map((work, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-rose-400 ring-4 ring-white" />
                                        <h4 className="font-bold text-gray-800">{work.job_title}</h4>
                                        <p className="text-sm text-gray-600">{work.company}</p>
                                        <span className="text-xs text-gray-400 mt-1 block">{work.start_date} - {work.end_date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {resume.educations?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-rose-600" />
                                تحصیلات
                            </h3>
                            <div className="space-y-4 border-r-2 border-gray-100 pr-4">
                                {resume.educations.map((edu, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-rose-400 ring-4 ring-white" />
                                        <h4 className="font-bold text-gray-800">{edu.degree} - {edu.field}</h4>
                                        <p className="text-sm text-gray-600">{edu.university}</p>
                                        <span className="text-xs text-gray-400 mt-1 block">{edu.start_date} - {edu.end_date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {resume.skills?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-rose-600" />
                                مهارت‌ها
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {resume.skills.map((skill, idx) => (
                                    <span key={idx} className="rounded-xl bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
                                        {skill.name} <span className="text-xs opacity-70">({skill.level})</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Languages */}
                    {resume.languages?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Languages className="w-5 h-5 text-rose-600" />
                                زبان‌ها
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {resume.languages.map((lang, idx) => (
                                    <span key={idx} className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                                        {lang.name} <span className="text-xs opacity-70">({lang.level})</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
                {/* Header */}
                <header className="sticky top-3 z-50 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:px-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-tight text-slate-950">ChinVerse</span>
                        <span className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">Profile</span>
                    </div>
                    <div className="flex gap-2 text-slate-500">
                        <Link href="/community" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600"><MessageCircle className="w-5 h-5" /></Link>
                        <NotificationBellLink />
                        <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600" aria-label="تنظیمات"><Settings className="w-5 h-5" /></Link>
                    </div>
                </header>

                <main className="flex flex-col gap-5 pb-4">
                    {/* Hero Section */}
                    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 px-5 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                        <div className="absolute -left-16 top-0 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl" />
                        <div className="absolute -bottom-20 right-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
                        <div className="relative flex flex-col items-center">
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarFileChange}
                        />
                        <div className="relative mb-4">
                            <div className="h-32 w-32 rounded-[32px] border border-white/30 bg-white/10 p-1 shadow-2xl">
                                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 relative flex items-center justify-center">
                                    {user?.profile?.avatar_url ? (
                                        <Image
                                            src={getMediaUrl(user.profile.avatar_url)}
                                            alt="Avatar"
                                            width={128}
                                            height={128}
                                            className="object-cover w-full h-full"
                                            unoptimized
                                        />
                                    ) : (
                                        <UserIcon className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                                className="absolute -bottom-1 -left-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white text-rose-600 shadow-[0_14px_32px_rgba(15,23,42,0.22)] transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                                aria-label="تغییر عکس پروفایل"
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Camera className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        <h1 className="mb-1 text-2xl font-black tracking-tight text-white">
                            {user?.profile?.display_name || "کاربر مهمان"}
                        </h1>

                        <p className="mb-2 text-sm font-medium text-white/70">
                            {user?.profile?.headline || "عنوان شغلی"}
                        </p>

                        {/* Location */}
                        <div className="mb-5 flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/65">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{user?.profile?.city || "موقعیت مکانی"}</span>
                        </div>

                        {/* Followers / Following counts */}
                        <div className="grid w-full max-w-md grid-cols-2 gap-3 text-sm">
                            <Link href="/profile/network" className="rounded-[24px] border border-white/10 bg-white/10 p-4 text-center transition hover:bg-white/15">
                                <span className="block text-2xl font-black text-white">{followersCount}</span>
                                <span className="text-xs">دنبال‌کننده</span>
                            </Link>
                            <Link href="/profile/network" className="rounded-[24px] border border-white/10 bg-white/10 p-4 text-center transition hover:bg-white/15">
                                <span className="block text-2xl font-black text-white">{followingCount}</span>
                                <span className="text-xs">دنبال‌شونده</span>
                            </Link>
                        </div>
                        </div>
                    </section>

                    {/* Tab Navigation */}
                    <div className="sticky top-[76px] z-40 rounded-[28px] border border-white/70 bg-white/92 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        <div className="grid grid-cols-2 gap-2">
                            {tabs.map((tab, index) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex min-h-[64px] items-center gap-2 rounded-[22px] border px-3 py-2 text-right transition-all",
                                            index === tabs.length - 1 && "col-span-2",
                                            isActive
                                                ? "border-transparent bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_14px_30px_rgba(244,63,94,0.2)]"
                                                : "border-slate-100 bg-slate-50/80 text-slate-600 hover:bg-white hover:text-slate-900",
                                        )}
                                    >
                                        <span className={cn(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                                            isActive ? "bg-white/18 text-white" : "bg-white text-rose-500 shadow-sm",
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-black leading-5">{tab.label}</span>
                                            <span className={cn("mt-0.5 block text-[11px]", isActive ? "text-white/70" : "text-slate-400")}>
                                                {tab.helper}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <section className="min-h-[300px] overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl">
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
                    onClose={() => setIsResumeModalOpen(false)}
                    user={user}
                    onUpdate={fetchUser}
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
                                        <UserIcon className="w-5 h-5 text-rose-600" />
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
                                        <span className="mt-0.5 block text-xs text-slate-400">متن، پین‌یین، هایلایت و سرعت پخش</span>
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
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <UserPlus className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="font-medium text-gray-800">ثبت نام</span>
                                </Link>

                                {/* 5. خروج */}
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 rounded-2xl p-4 transition hover:bg-orange-50"
                                >
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <LogOut className="w-5 h-5 text-orange-600" />
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
                    <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                    <span>در حال بارگذاری منتخب‌ها...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-rose-50 text-rose-500">
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
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="relative mb-6">
                    <div className="flex h-28 w-28 items-center justify-center rounded-[34px] bg-gradient-to-br from-sky-50 via-white to-rose-50 text-blue-600 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                        <BookmarkCheck className="h-14 w-14" strokeWidth={1.6} />
                    </div>
                    <span className="absolute -bottom-2 -left-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_14px_30px_rgba(37,99,235,0.25)]">
                        <Compass className="h-5 w-5" />
                    </span>
                </div>

                <h3 className="text-xl font-black tracking-tight text-slate-950">اولین مجموعه‌ات رو انتخاب کن!</h3>
                <p className="mt-3 max-w-xs text-sm leading-7 text-slate-500">
                    هر course را از صفحه کاوش ذخیره کنی، اینجا برای دسترسی سریع نگه داشته می‌شود.
                </p>

                <Link
                    href="/explore"
                    className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-sky-600 px-5 py-3 text-sm font-black text-white shadow-[0_18px_38px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(37,99,235,0.34)]"
                >
                    <Compass className="h-4 w-4" />
                    کاوش کن
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-slate-950">مجموعه‌های منتخب</h3>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                        courseهایی که ذخیره کردی برای برگشت سریع اینجا هستند.
                    </p>
                </div>
                <Link
                    href="/explore"
                    className="shrink-0 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                >
                    کاوش
                </Link>
            </div>

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
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-500 to-orange-500 text-white">
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
                                        <Link
                                            href={href}
                                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800"
                                            aria-label="ادامه دوره"
                                        >
                                            <PlayCircle className="h-4 w-4" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCourse(course.id)}
                                            disabled={removingId === course.id}
                                            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
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
