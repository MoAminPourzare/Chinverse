'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User as UserIcon, ThumbsUp, MessageCircle, MoreHorizontal } from "lucide-react";
import api from "@/lib/api";

type TabType = "activities" | "learning";

interface FeedProvider {
    id: number;
    display_name?: string;
    avatar_url?: string;
    headline?: string;
}

interface GalleryData {
    id: number;
    image_url: string;
    caption?: string;
}

interface ServiceData {
    id: number;
    title: string;
    description: string;
    banner_url?: string;
    price_label?: string;
}

interface FeedItem {
    id: string;
    type: "gallery" | "service";
    created_at?: string;
    data: GalleryData | ServiceData;
    provider?: FeedProvider;
}

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

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<TabType>("activities");
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            if (activeTab !== "activities") return;

            setLoading(true);
            try {
                const response = await api.get<FeedItem[]>('/feed');
                setFeedItems(response.data);
            } catch (error) {
                console.error("Failed to fetch feed", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, [activeTab]);

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center justify-center px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-600 text-2xl">🌀</span>
                        <span className="text-lg font-bold text-blue-800">چین ورس</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-8 px-4 border-t border-gray-50">
                    <button
                        onClick={() => setActiveTab("activities")}
                        className={`relative py-3 px-2 text-sm font-medium transition-colors ${activeTab === "activities" ? "text-blue-700" : "text-gray-400"
                            }`}
                    >
                        فعالیت‌ها
                        {activeTab === "activities" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("learning")}
                        className={`relative py-3 px-2 text-sm font-medium transition-colors ${activeTab === "learning" ? "text-blue-700" : "text-gray-400"
                            }`}
                    >
                        روند یادگیری
                        {activeTab === "learning" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t-full" />
                        )}
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="pb-4">
                {activeTab === "activities" ? (
                    loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {feedItems.map((item) => (
                                item.type === "service" ? (
                                    <ServiceFeedCard key={item.id} item={item} />
                                ) : (
                                    <GalleryFeedCard key={item.id} item={item} />
                                )
                            ))}
                            {feedItems.length === 0 && (
                                <div className="text-center py-20 text-gray-500">
                                    هنوز فعالیتی ثبت نشده است
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <span className="text-4xl mb-4">📚</span>
                        <p>روند یادگیری شما به زودی...</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ===== SERVICE FEED CARD =====

function ServiceFeedCard({ item }: { item: FeedItem }) {
    const service = item.data as ServiceData;
    const provider = item.provider;

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Provider Header */}
            <div className="flex items-center gap-3 p-4 pb-3">
                <Link href={`/users/${provider?.id || 0}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden relative border-2 border-blue-500">
                        {provider?.avatar_url ? (
                            <Image
                                src={getImageUrl(provider.avatar_url)}
                                alt={provider.display_name || "User"}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-blue-400" />
                            </div>
                        )}
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">
                        {provider?.display_name || "کاربر"}
                    </p>
                    {provider?.headline && (
                        <p className="text-xs text-gray-500 truncate">{provider.headline}</p>
                    )}
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex gap-3 px-4">
                {/* Left: Banner Image */}
                {service.banner_url && (
                    <div className="w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden relative bg-gray-100">
                        <Image
                            src={getImageUrl(service.banner_url)}
                            alt={service.title}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                )}

                {/* Right: Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                        {service.title}
                    </h3>
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 mb-2">
                        {service.description}
                    </p>
                    <Link href={`#`} className="text-xs text-blue-600 font-medium">
                        ... بیشتر
                    </Link>
                </div>
            </div>

            {/* Action Button */}
            <div className="p-4 pt-3">
                <Link
                    href={`/chat/${provider?.id || 0}`}
                    className="block w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium text-center text-sm hover:bg-blue-700 transition-colors"
                >
                    درخواست مشاوره
                </Link>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>۱۵</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>۱۰</span>
                    </div>
                </div>
                {item.created_at && (
                    <span>تاریخ انتشار: {new Date(item.created_at).toLocaleDateString("fa-IR")}</span>
                )}
            </div>
        </div>
    );
}

// ===== GALLERY FEED CARD =====

function GalleryFeedCard({ item }: { item: FeedItem }) {
    const gallery = item.data as GalleryData;
    const provider = item.provider;

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Provider Header */}
            <div className="flex items-center gap-3 p-4 pb-3">
                <Link href={`/users/${provider?.id || 0}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden relative border-2 border-blue-500">
                        {provider?.avatar_url ? (
                            <Image
                                src={getImageUrl(provider.avatar_url)}
                                alt={provider.display_name || "User"}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-blue-400" />
                            </div>
                        )}
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">
                        {provider?.display_name || "کاربر"}
                    </p>
                    {item.created_at && (
                        <p className="text-xs text-gray-400">
                            {new Date(item.created_at).toLocaleDateString("fa-IR")}
                        </p>
                    )}
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Image */}
            <div className="relative w-full aspect-video bg-gray-100">
                <Image
                    src={getImageUrl(gallery.image_url)}
                    alt={gallery.caption || "Gallery image"}
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>

            {/* Caption & Footer */}
            <div className="p-4">
                {gallery.caption && (
                    <p className="text-gray-700 text-sm mb-3">{gallery.caption}</p>
                )}
                <div className="flex items-center gap-4 text-gray-400">
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <ThumbsUp className="w-5 h-5" />
                        <span className="text-sm">۱۲</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">۸</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
