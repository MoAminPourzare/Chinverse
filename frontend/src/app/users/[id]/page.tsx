'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Share2,
    Users,
    MapPin,
    User as UserIcon,
    Globe,
    MessageCircle,
    Briefcase,
    GraduationCap,
    Award,
    Wrench,
    Languages,
    X,
} from "lucide-react";
import { userService, PublicUser, GalleryItemPublic } from "@/services/user.service";
import ServicesTab from "@/components/profile/ServicesTab";
import { getMediaUrl } from "@/lib/media";
import { getSocialLinkRel, getSocialLinkTarget, getSocialPlatform, getSocialProfileUrl } from "@/lib/socialLinks";
import { BackButton } from "@/components/ui/IconButton";

interface Tab {
    id: string;
    label: string;
}

const tabs: Tab[] = [
    { id: "about", label: "درباره من" },
    { id: "resume", label: "رزومه" },
    { id: "gallery", label: "گالری" },
    { id: "services", label: "خدمات" },
];

export default function PublicProfilePage() {
    const params = useParams();
    const userId = Number(params.id);

    const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<GalleryItemPublic | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await userService.getPublicProfile(userId);
                setUser(data);

                // Fetch follow status and count
                try {
                    const following = await userService.isFollowing(userId);
                    setIsFollowing(following);
                } catch {
                    // User not logged in, ignore
                }

                const count = await userService.getFollowersCount(userId);
                setFollowersCount(count);
            } catch (error) {
                console.error("Failed to fetch user", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const handleFollowToggle = async () => {
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await userService.unfollowUser(userId);
                setIsFollowing(false);
                setFollowersCount(prev => prev - 1);
            } else {
                await userService.followUser(userId);
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Failed to toggle follow", error);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: user?.profile?.display_name || "پروفایل کاربر",
                url: window.location.href,
            });
        } catch {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert("لینک پروفایل کپی شد!");
        }
    };

    const renderTabContent = () => {
        if (!user?.profile) return null;

        if (activeTab === "about") {
            return (
                <div className="p-6">
                    {user.profile.bio && (
                        <div className="mb-6">
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {user.profile.bio}
                            </p>
                        </div>
                    )}

                    {(user.profile.websites?.length ?? 0) > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                وبسایت
                            </h3>
                            <div className="flex flex-col gap-2">
                                {user.profile.websites?.map((url, idx) => (
                                    <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="dir-ltr flex truncate text-left text-sm text-[#155aa6] hover:underline"
                                    >
                                        <span className="text-gray-400">🔗</span>
                                        {url}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {(user.profile.socials?.length ?? 0) > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                ✏️ شبکه‌های اجتماعی
                            </h3>
                            <div className="grid gap-2">
                                {user.profile.socials?.map((social, idx) => {
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

                    {!user.profile.bio && !user.profile.websites?.length && !user.profile.socials?.length && (
                        <div className="text-center py-12 text-gray-400">
                            اطلاعاتی ثبت نشده است
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === "resume") {
            const resume = user.profile.resume;
            const isEmpty = !resume || Object.values(resume).every((arr) => !arr || arr.length === 0);

            if (isEmpty) {
                return (
                    <div className="text-center py-12 text-gray-400">
                        رزومه‌ای ثبت نشده است
                    </div>
                );
            }

            return (
                <div className="p-6 space-y-8">
                    {/* Work Experience */}
                    {resume.work_experiences?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-[#155aa6]" />
                                سوابق کاری
                            </h3>
                            <div className="space-y-4 border-r-2 border-gray-100 pr-4">
                                {resume.work_experiences.map((work, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-[#155aa6] ring-4 ring-white" />
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
                                <GraduationCap className="w-5 h-5 text-[#155aa6]" />
                                تحصیلات
                            </h3>
                            <div className="space-y-4 border-r-2 border-gray-100 pr-4">
                                {resume.educations.map((edu, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -right-[21px] top-1 w-3 h-3 rounded-full bg-[#155aa6] ring-4 ring-white" />
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
                                <Wrench className="w-5 h-5 text-[#155aa6]" />
                                مهارت‌ها
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {resume.skills.map((skill, idx) => (
                                    <span key={idx} className="rounded-xl bg-[#eef6ff] px-3 py-1 text-sm font-medium text-[#155aa6]">
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
                                <Languages className="w-5 h-5 text-[#155aa6]" />
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

                    {/* Certificates */}
                    {resume.certificates?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-[#155aa6]" />
                                گواهینامه‌ها
                            </h3>
                            <div className="space-y-2">
                                {resume.certificates.map((cert, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                        <h4 className="font-medium text-gray-800">{cert.title}</h4>
                                        <p className="text-sm text-gray-500">{cert.issuer} • {cert.date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === "gallery") {
            const galleryItems = user.gallery_items || [];

            if (galleryItems.length === 0) {
                return (
                    <div className="text-center py-12 text-gray-400">
                        تصویری در گالری نیست
                    </div>
                );
            }

            return (
                <div className="p-4">
                    <div className="grid grid-cols-3 gap-1">
                        {galleryItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedImage(item)}
                                className="aspect-square bg-gray-100 relative overflow-hidden rounded hover:opacity-90 transition-opacity"
                            >
                                <Image
                                    src={getMediaUrl(item.image_url)}
                                    alt={item.caption || "Gallery image"}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        if (activeTab === "services") {
            return <ServicesTab userId={userId} readOnly={true} />;
        }

        return null;
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center py-20">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-full flex-col items-center justify-center py-20">
                <p className="text-gray-500 mb-4">کاربر یافت نشد</p>
                <Link href="/showcase" className="rounded-2xl bg-[#155aa6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0f4e92]">
                    بازگشت به ویترین
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            {/* Header */}
            <header className="sticky top-3 z-50 grid grid-cols-[44px_1fr_44px] items-center rounded-[28px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                <BackButton href="/showcase" className="justify-self-end" />
                <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-slate-950">پروفایل کاربر</span>
                    <span className="rounded-full bg-[#eef6ff] px-2 py-0.5 text-xs font-bold text-[#155aa6]">چین‌ورس</span>
                </div>
                <div className="w-9" />
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-4 pt-5">
                {/* Hero Section */}
                <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#0b2f5f_0%,#155aa6_58%,#0f7f88_100%)] px-5 py-7 text-white shadow-[0_24px_70px_rgba(21,90,166,0.20)]">
                    <div className="absolute -left-16 top-0 h-44 w-44 rounded-full bg-white/16 blur-3xl" />
                    <div className="absolute -bottom-20 right-16 h-56 w-56 rounded-full bg-[#ffb74d]/20 blur-3xl" />
                    <div className="relative flex flex-col items-center">
                    <div className="relative mb-4">
                        <div className="h-28 w-28 rounded-[30px] border border-white/30 bg-white/10 p-1 shadow-2xl">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 relative flex items-center justify-center">
                                {user.profile?.avatar_url ? (
                                    <Image
                                        src={getMediaUrl(user.profile.avatar_url)}
                                        alt="Avatar"
                                        width={112}
                                        height={112}
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
                        {user.profile?.display_name || "کاربر"}
                    </h1>

                    <p className="mb-2 text-sm font-medium text-white/70">
                        {user.profile?.headline || ""}
                    </p>

                    <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-xs text-white/65">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{[user.profile?.city, user.profile?.country].filter(Boolean).join("، ") || "موقعیت نامشخص"}</span>
                        </div>
                        <span className="text-white/25">|</span>
                        <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{followersCount}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid w-full max-w-lg grid-cols-3 gap-3">
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
                        >
                            <Share2 className="w-4 h-4" />
                            اشتراک
                        </button>
                        <Link
                            href={`/chat/${userId}`}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
                        >
                            <MessageCircle className="w-4 h-4" />
                            پیام
                        </Link>
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors ${isFollowing
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-white text-[#155aa6] shadow-[0_12px_28px_rgba(255,255,255,0.22)] hover:bg-[#eef6ff]"
                                } ${followLoading ? "opacity-50" : ""}`}
                        >
                            <Users className="w-4 h-4" />
                            {followLoading ? "..." : isFollowing ? "لغو" : "شبکه"}
                        </button>
                    </div>
                    </div>
                </section>

                {/* Tab Navigation */}
                <div className="sticky top-[76px] z-40 rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                    <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-bold transition-all
                                    ${activeTab === tab.id ? "bg-[#155aa6] text-white shadow-[0_12px_26px_rgba(21,90,166,0.18)]" : "text-slate-500 hover:bg-[#eef6ff] hover:text-[#155aa6]"}
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <section className="min-h-[200px] overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl">
                    {renderTabContent()}
                </section>
            </main>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="modal-backdrop-motion fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="modal-panel-motion relative max-h-full max-w-full">
                        <Image
                            src={getMediaUrl(selectedImage.image_url)}
                            alt={selectedImage.caption || "Gallery image"}
                            width={800}
                            height={800}
                            className="object-contain max-h-[80vh]"
                            unoptimized
                        />
                        {selectedImage.caption && (
                            <p className="text-white text-center mt-4">{selectedImage.caption}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
