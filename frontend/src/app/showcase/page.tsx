'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, MapPin, GraduationCap, User as UserIcon } from "lucide-react";
import { userService, ShowcaseUser, ServiceWithProvider } from "@/services/user.service";

type TabType = "talents" | "services";

// Helper function to construct proper image URLs
const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "";

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    if (path.startsWith("http")) return path;

    if (path.includes("/uploads/gallery/")) {
        const filename = path.split("/").pop();
        return `${API_URL}/static/uploads/gallery/${filename}`;
    }

    if (path.includes("/uploads/services/")) {
        const filename = path.split("/").pop();
        return `${API_URL}/static/uploads/services/${filename}`;
    }

    if (path.includes("/uploads/avatars/")) {
        return `${API_URL}${path}`;
    }

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_URL}${cleanPath}`;
};

export default function ShowcasePage() {
    const [activeTab, setActiveTab] = useState<TabType>("talents");
    const [users, setUsers] = useState<ShowcaseUser[]>([]);
    const [services, setServices] = useState<ServiceWithProvider[]>([]);
    const [loading, setLoading] = useState(true);

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
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    return (
        <div className="min-h-full bg-white" dir="rtl">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-50 border-b border-gray-100">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Search className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab("services")}
                        className={`text-sm font-medium relative transition-colors pb-2 ${activeTab === "services" ? "text-blue-700 font-bold" : "text-gray-400"
                            }`}
                    >
                        ویترین خدمات
                        {activeTab === "services" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("talents")}
                        className={`text-sm font-medium relative transition-colors pb-2 ${activeTab === "talents" ? "text-blue-700 font-bold" : "text-gray-400"
                            }`}
                    >
                        ویترین استعدادها
                        {activeTab === "talents" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t-full" />
                        )}
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="pb-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : activeTab === "talents" ? (
                    <div className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <TalentCard key={user.id} user={user} />
                        ))}
                        {users.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                هنوز کاربری ثبت نشده است
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {services.map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                        {services.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                هنوز خدماتی ثبت نشده است
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

// ===== TALENT CARD =====

interface TalentCardProps {
    user: ShowcaseUser;
}

function TalentCard({ user }: TalentCardProps) {
    const galleryImages = user.gallery_preview.slice(0, 3);

    return (
        <div className="p-4 bg-white hover:bg-gray-50 transition-colors">
            <div className="flex gap-3">
                {/* Left: Gallery Grid */}
                <div className="flex-shrink-0 w-24">
                    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                        {galleryImages.length > 0 ? (
                            <>
                                <div className="col-span-1 row-span-2 aspect-[3/4] bg-gray-100 relative">
                                    <Image
                                        src={getImageUrl(galleryImages[0])}
                                        alt="Gallery"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <div className="aspect-square bg-gray-100 relative">
                                    {galleryImages[1] ? (
                                        <Image
                                            src={getImageUrl(galleryImages[1])}
                                            alt="Gallery"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100" />
                                    )}
                                </div>
                                <div className="aspect-square bg-gray-100 relative">
                                    {galleryImages[2] ? (
                                        <Image
                                            src={getImageUrl(galleryImages[2])}
                                            alt="Gallery"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100" />
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="col-span-1 row-span-2 aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-200" />
                                <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-200" />
                                <div className="aspect-square bg-gradient-to-br from-pink-100 to-pink-200" />
                            </>
                        )}
                    </div>
                </div>

                {/* Right: User Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 relative">
                            {user.avatar_url ? (
                                <Image
                                    src={getImageUrl(user.avatar_url)}
                                    alt={user.display_name || "User"}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">
                                {user.display_name || "کاربر"}
                            </h3>
                            <p className="text-xs text-blue-600 font-medium truncate">
                                {user.headline || ""}
                            </p>
                        </div>
                    </div>

                    {(user.city || user.country) && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                            <MapPin className="w-3 h-3" />
                            <span>{[user.city, user.country].filter(Boolean).join("، ")}</span>
                        </div>
                    )}

                    {user.education && (
                        <div className="space-y-1 text-xs text-gray-600 mb-2">
                            {user.education.university && (
                                <div className="flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3 text-gray-400" />
                                    <span className="truncate">فارغ التحصیل از: {user.education.university}</span>
                                </div>
                            )}
                            {user.education.field && (
                                <span className="text-gray-500">رشته تحصیلی: {user.education.field}</span>
                            )}
                        </div>
                    )}

                    {user.hsk_level && (
                        <div className="text-xs text-gray-500 mb-2">
                            دارای مدرک: <span className="text-blue-600">{user.hsk_level}</span>
                        </div>
                    )}

                    <Link
                        href={`/users/${user.id}`}
                        className="inline-block text-xs text-blue-600 font-medium hover:underline"
                    >
                        مشاهده پروفایل
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ===== SERVICE CARD =====

interface ServiceCardProps {
    service: ServiceWithProvider;
}

function ServiceCard({ service }: ServiceCardProps) {
    return (
        <div className="bg-gray-50 rounded-2xl overflow-hidden">
            {/* Banner Image */}
            {service.banner_url && (
                <div className="relative w-full h-40">
                    <Image
                        src={getImageUrl(service.banner_url)}
                        alt={service.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                    {service.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {service.description}
                </p>

                {/* Provider Info */}
                {service.provider && (
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative flex-shrink-0">
                            {service.provider.avatar_url ? (
                                <Image
                                    src={getImageUrl(service.provider.avatar_url)}
                                    alt={service.provider.display_name || "Provider"}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {service.provider.display_name || "کاربر"}
                            </p>
                            {service.provider.headline && (
                                <p className="text-xs text-gray-500 truncate">
                                    {service.provider.headline}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {service.price_label && (
                    <p className="text-sm text-gray-500 mb-4">
                        هزینه: <span className="font-medium text-gray-700">{service.price_label}</span>
                    </p>
                )}

                {/* Action Button */}
                <Link
                    href={`/chat/${service.provider?.id || 0}`}
                    className="block w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-center hover:bg-blue-700 transition-colors"
                >
                    درخواست مشاوره
                </Link>
            </div>
        </div>
    );
}
