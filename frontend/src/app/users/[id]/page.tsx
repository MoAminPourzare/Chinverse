'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    ArrowRight,
    Share2,
    Users,
    MapPin,
    User as UserIcon,
    Globe,
    Instagram,
    Linkedin,
    Twitter,
    MessageCircle,
    Briefcase,
    GraduationCap,
    Award,
    Wrench,
    Languages,
    X,
    type LucideIcon
} from "lucide-react";
import { userService, PublicUser, GalleryItemPublic } from "@/services/user.service";
import ServicesTab from "@/components/profile/ServicesTab";
import { getMediaUrl } from "@/lib/media";

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

const socialIcons: Record<string, LucideIcon> = {
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter,
    telegram: MessageCircle,
    whatsapp: MessageCircle,
    wechat: MessageCircle,
    x: X,
};

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
                                        className="text-blue-600 text-sm hover:underline dir-ltr text-left truncate flex items-center gap-2"
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
                            <div className="space-y-2">
                                {user.profile.socials?.map((social, idx) => {
                                    const Icon = socialIcons[social.platform] || MessageCircle;
                                    return (
                                        <div key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                                            <Icon className="w-4 h-4 text-blue-500" />
                                            <span className="dir-ltr">{social.handle}</span>
                                            <span className="text-gray-400">🔗</span>
                                        </div>
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
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                سوابق کاری
                            </h3>
                            <div className="space-y-4 border-r-2 border-gray-100 pr-4">
                                {resume.work_experiences.map((work, idx) => (
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
                                {resume.educations.map((edu, idx) => (
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
                                {resume.skills.map((skill, idx) => (
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
                                <Award className="w-5 h-5 text-blue-600" />
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
            <div className="min-h-full bg-white flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-full bg-white flex flex-col items-center justify-center py-20">
                <p className="text-gray-500 mb-4">کاربر یافت نشد</p>
                <Link href="/showcase" className="text-blue-600 hover:underline">
                    بازگشت به ویترین
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-white" dir="rtl">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-50 border-b border-gray-100">
                <Link href="/showcase" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-blue-800">چین ورس</span>
                    <span className="text-blue-600">🌀</span>
                </div>
                <div className="w-9" /> {/* Spacer for centering */}
            </header>

            <main className="pb-4">
                {/* Hero Section */}
                <section className="flex flex-col items-center mt-8 mb-6 px-4">
                    <div className="relative mb-4">
                        <div className="w-28 h-28 rounded-full border-[3px] border-blue-600 p-1">
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

                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                        {user.profile?.display_name || "کاربر"}
                    </h1>

                    <p className="text-blue-600 text-sm font-medium mb-2">
                        {user.profile?.headline || ""}
                    </p>

                    <div className="flex items-center text-gray-400 text-xs gap-2 mb-4">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{[user.profile?.city, user.profile?.country].filter(Boolean).join("، ") || "موقعیت نامشخص"}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{followersCount}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full max-w-xs">
                        <button
                            onClick={handleShare}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-full text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            اشتراک
                        </button>
                        <Link
                            href={`/chat/${userId}`}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-full text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            پیام
                        </Link>
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${isFollowing
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                                } ${followLoading ? "opacity-50" : ""}`}
                        >
                            <Users className="w-4 h-4" />
                            {followLoading ? "..." : isFollowing ? "لغو" : "شبکه"}
                        </button>
                    </div>
                </section>

                {/* Tab Navigation */}
                <div className="sticky top-[53px] bg-white z-40 border-b border-gray-100">
                    <div className="flex justify-center px-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap px-5 py-3 text-sm font-medium transition-all relative
                                    ${activeTab === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}
                                `}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <section className="min-h-[200px]">
                    {renderTabContent()}
                </section>
            </main>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative max-w-full max-h-full">
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
