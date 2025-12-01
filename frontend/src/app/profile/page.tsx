'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings, Bell, MessageCircle, MapPin, User as UserIcon, PenLine, Globe, Instagram, Linkedin, Twitter, FileText, Briefcase, GraduationCap, Award, Wrench, Languages } from "lucide-react";
import { userService, User } from "@/services/user.service";
import EditAboutMeModal from "@/components/profile/EditAboutMeModal";
import EditResumeModal from "@/components/profile/EditResumeModal";
import GalleryTab from "@/components/gallery/GalleryTab";

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

const socialIcons: Record<string, any> = {
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter,
    telegram: MessageCircle,
    whatsapp: MessageCircle,
    wechat: MessageCircle,
};

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
    const [user, setUser] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

    const fetchUser = async () => {
        try {
            const data = await userService.getMe();
            setUser(data);
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
                            {/* Placeholder illustration - using a simple SVG representation or Icon */}
                            <PenLine className="w-24 h-24 text-blue-200" strokeWidth={1} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            یه معرفی کوتاه درباره خودت بنویس!
                        </h3>
                        <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
                            با نوشتن یک معرفی کوتاه، به بقیه نشون بده کی هستی و به چه حوزه‌هایی علاقه داری. میتونی لینک وبسایت یا شبکه‌هات رو هم اینجا بذاری.
                        </p>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-blue-800 text-white rounded-xl p-3 shadow-lg hover:bg-blue-900 transition-colors"
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
                        className="absolute top-4 left-4 text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
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
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline dir-ltr text-left truncate">
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
            const isEmpty = !resume || Object.values(resume).every((arr: any) => !arr || arr.length === 0);

            if (isEmpty) {
                return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="mb-6 relative">
                            <FileText className="w-24 h-24 text-blue-200" strokeWidth={1} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            رزومه ات رو ثبت کن!
                        </h3>
                        <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
                            با افزودن مهارت‌ها، سوابق و مدارک، رزومه‌ات در بخش ویترین برای دیگران نمایش داده میشه و شانس همکاری یا پروژه بیشتر میشه.
                        </p>
                        <button
                            onClick={() => setIsResumeModalOpen(true)}
                            className="bg-blue-800 text-white rounded-xl p-3 shadow-lg hover:bg-blue-900 transition-colors"
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
                        className="absolute top-4 left-4 text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors z-10"
                    >
                        <PenLine className="w-5 h-5" />
                    </button>

                    {/* Work Experience */}
                    {resume.work_experiences?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                سوابق کاری
                            </h3>
                            <div className="space-y-4 border-r-2 border-gray-100 pr-4">
                                {resume.work_experiences.map((work: any, idx: number) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-blue-400 ring-4 ring-white" />
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
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                تحصیلات
                            </h3>
                            <div className="space-y-4 border-r-2 border-gray-100 pr-4">
                                {resume.educations.map((edu: any, idx: number) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-blue-400 ring-4 ring-white" />
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
                                <Wrench className="w-5 h-5 text-blue-600" />
                                مهارت‌ها
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {resume.skills.map((skill: any, idx: number) => (
                                    <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
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
                                <Languages className="w-5 h-5 text-blue-600" />
                                زبان‌ها
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {resume.languages.map((lang: any, idx: number) => (
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

        const tab = tabs.find((t) => t.id === activeTab);
        return (
            <div className="p-8 text-center text-gray-500">
                محتوای بخش {tab?.label}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[80vh] relative">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white/95 sticky top-0 z-50 backdrop-blur-sm border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-blue-800 tracking-tighter">ChinVerse</span>
                    </div>
                    <div className="flex gap-5 text-gray-600">
                        <Link href="/chat" className="hover:text-blue-600 transition-colors"><MessageCircle className="w-6 h-6" /></Link>
                        <Link href="/notifications" className="hover:text-blue-600 transition-colors"><Bell className="w-6 h-6" /></Link>
                        <Link href="/account" className="hover:text-blue-600 transition-colors"><Settings className="w-6 h-6" /></Link>
                    </div>
                </header>

                <main className="pb-20">
                    {/* Hero Section */}
                    <section className="flex flex-col items-center mt-8 mb-8 px-4">
                        <div className="relative mb-4">
                            <div className="w-32 h-32 rounded-full border-[3px] border-blue-600 p-1">
                                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 relative flex items-center justify-center">
                                    {user?.profile?.avatar_url ? (
                                        <Image
                                            src={`http://localhost:8000${user.profile.avatar_url}`}
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

                        <h1 className="text-xl font-bold text-gray-900 mb-1">
                            {user?.profile?.display_name || "کاربر مهمان"}
                        </h1>

                        <p className="text-gray-500 text-sm font-medium mb-3">
                            {user?.profile?.headline || "عنوان شغلی"}
                        </p>

                        <div className="flex items-center text-gray-400 text-xs gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{user?.profile?.city || "موقعیت مکانی"}</span>
                        </div>
                    </section>

                    {/* Tab Navigation */}
                    <div className="sticky top-[61px] bg-white z-40 shadow-sm">
                        <div className="flex overflow-x-auto no-scrollbar px-2 border-b border-gray-100">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    whitespace-nowrap px-4 py-3 text-sm font-bold transition-all relative flex-shrink-0
                    ${activeTab === tab.id ? "text-blue-700" : "text-gray-500 hover:text-gray-700"}
                `}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t-full mx-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <section className="min-h-[300px] bg-gray-50/30">
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
            </div>
        </div>
    );
}
