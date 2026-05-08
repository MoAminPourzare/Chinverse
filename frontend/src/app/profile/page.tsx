'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Bell, MessageCircle, MapPin, User as UserIcon, PenLine, Globe, Instagram, Linkedin, Twitter, FileText, Briefcase, GraduationCap, Wrench, Languages, LogIn, UserPlus, LogOut, X, Info, Trash2, type LucideIcon } from "lucide-react";
import { userService, User } from "@/services/user.service";
import EditAboutMeModal from "@/components/profile/EditAboutMeModal";
import EditResumeModal from "@/components/profile/EditResumeModal";
import GalleryTab from "@/components/gallery/GalleryTab";
import ServicesTab from "@/components/profile/ServicesTab";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";

interface Tab {
    id: string;
    label: string;
}

const tabs: Tab[] = [
    { id: "about", label: "درباره من" },
    { id: "collections", label: "مجموعه های منتخب" },
    { id: "resume", label: "رزومه" },
    { id: "gallery", label: "گالری" },
    { id: "services", label: "خدمات" },
];

const socialIcons: Record<string, LucideIcon> = {
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter,
    telegram: MessageCircle,
    whatsapp: MessageCircle,
    wechat: MessageCircle,
};

export default function ProfilePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
    const [user, setUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [followersCount, setFollowersCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/landing');
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
                router.push('/landing');
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
                            <div className="flex gap-4 flex-wrap">
                                {user?.profile?.socials?.map((social, idx) => {
                                    const Icon = socialIcons[social.platform] || MessageCircle;
                                    return (
                                        <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg text-gray-600 text-sm">
                                            <Icon className="w-4 h-4" />
                                            <span className="dir-ltr">{social.handle}</span>
                                        </div>
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
                        <Link href="/notifications" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600"><Bell className="w-5 h-5" /></Link>
                        <button onClick={() => setIsSettingsOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600"><Settings className="w-5 h-5" /></button>
                    </div>
                </header>

                <main className="flex flex-col gap-5 pb-4">
                    {/* Hero Section */}
                    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 px-5 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                        <div className="absolute -left-16 top-0 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl" />
                        <div className="absolute -bottom-20 right-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
                        <div className="relative flex flex-col items-center">
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
                    <div className="sticky top-[76px] z-40 rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        <div className="flex overflow-x-auto no-scrollbar gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "relative flex-shrink-0 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold transition-all",
                                        activeTab === tab.id
                                            ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_12px_26px_rgba(244,63,94,0.18)]"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
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

                                {/* 2. درباره چین‌ورس */}
                                <Link
                                    href="/about"
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
