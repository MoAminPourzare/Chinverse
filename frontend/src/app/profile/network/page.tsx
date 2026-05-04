'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, User as UserIcon } from "lucide-react";
import { userService, NetworkUser } from "@/services/user.service";
import { getMediaUrl } from "@/lib/media";

type TabType = "followers" | "following";

export default function NetworkPage() {
    const [activeTab, setActiveTab] = useState<TabType>("followers");
    const [followers, setFollowers] = useState<NetworkUser[]>([]);
    const [following, setFollowing] = useState<NetworkUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [followersData, followingData] = await Promise.all([
                userService.getMyFollowers(),
                userService.getMyFollowing(),
            ]);
            setFollowers(followersData);
            setFollowing(followingData);
        } catch (error) {
            console.error("Failed to fetch network data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUnfollow = async (userId: number) => {
        try {
            await userService.unfollowUser(userId);
            setFollowing(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Failed to unfollow", error);
        }
    };

    const currentList = activeTab === "followers" ? followers : following;

    return (
        <div className="min-h-full bg-gray-50" dir="rtl">
            {/* Header */}
            <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-4 px-4 py-4">
                    <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">شبکه من</h1>
                </div>

                {/* Tabs */}
                <div className="flex border-t border-gray-50">
                    <button
                        onClick={() => setActiveTab("followers")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === "followers" ? "text-blue-700" : "text-gray-400"
                            }`}
                    >
                        دنبال‌کنندگان ({followers.length})
                        {activeTab === "followers" && (
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-700 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("following")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === "following" ? "text-blue-700" : "text-gray-400"
                            }`}
                    >
                        دنبال‌شوندگان ({following.length})
                        {activeTab === "following" && (
                            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-700 rounded-t-full" />
                        )}
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        {activeTab === "followers" ? (
                            <p>هنوز کسی شما را دنبال نمی‌کند</p>
                        ) : (
                            <>
                                <p>هنوز کسی را دنبال نمی‌کنید</p>
                                <Link
                                    href="/showcase"
                                    className="mt-4 inline-block text-blue-600 font-medium hover:underline"
                                >
                                    کاربران را کشف کنید
                                </Link>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {currentList.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm"
                            >
                                <Link href={`/users/${user.id}`} className="flex-shrink-0">
                                    <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden relative">
                                        {user.avatar_url ? (
                                            <Image
                                                src={getMediaUrl(user.avatar_url)}
                                                alt={user.display_name || "User"}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <UserIcon className="w-7 h-7 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">
                                        {user.display_name || "کاربر"}
                                    </p>
                                    {user.headline && (
                                        <p className="text-sm text-gray-500 truncate">
                                            {user.headline}
                                        </p>
                                    )}
                                </div>

                                {activeTab === "following" ? (
                                    <button
                                        onClick={() => handleUnfollow(user.id)}
                                        className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors"
                                    >
                                        دنبال نکردن
                                    </button>
                                ) : (
                                    <Link
                                        href={`/users/${user.id}`}
                                        className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-200 transition-colors"
                                    >
                                        مشاهده
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
