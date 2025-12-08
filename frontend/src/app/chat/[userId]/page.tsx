'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Send, Phone, Video, MoreVertical, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { userService, PublicUser } from "@/services/user.service";

// Helper function to construct proper image URLs
const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "";
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    if (path.startsWith("http")) return path;
    if (path.includes("/uploads/avatars/")) return `${API_URL}${path}`;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_URL}${cleanPath}`;
};

export default function ChatPage() {
    const params = useParams();
    const userId = Number(params.userId);

    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await userService.getPublicProfile(userId);
                setUser(data);
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

    const userName = user?.profile?.display_name || "کاربر";

    if (loading) {
        return (
            <div className="min-h-full bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-100 flex flex-col" dir="rtl">
            {/* Header */}
            <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
                <Link href={`/users/${userId}`} className="p-1 hover:bg-blue-700 rounded-full transition-colors">
                    <ArrowRight className="w-5 h-5" />
                </Link>

                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden relative flex-shrink-0">
                        {user?.profile?.avatar_url ? (
                            <Image
                                src={getImageUrl(user.profile.avatar_url)}
                                alt={userName}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-blue-200" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="font-bold">{userName}</h1>
                        <span className="text-xs text-blue-200">آنلاین</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-blue-700 rounded-full transition-colors">
                        <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-blue-700 rounded-full transition-colors">
                        <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-blue-700 rounded-full transition-colors">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Under Construction Message */}
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">🚧</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        چت با {userName}
                    </h2>
                    <p className="text-gray-500 max-w-xs mb-6">
                        این بخش در حال توسعه است. به زودی می‌توانید به صورت مستقیم با کاربران چت کنید.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-yellow-800 text-sm">
                        <strong>🔜 به زودی:</strong> پیام‌رسانی آنلاین، تماس صوتی و تصویری
                    </div>
                </div>
            </div>

            {/* Message Input (Visual Only) */}
            <div className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="پیام خود را بنویسید..."
                        disabled
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-right focus:outline-none disabled:cursor-not-allowed"
                    />
                    <button
                        disabled
                        className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
