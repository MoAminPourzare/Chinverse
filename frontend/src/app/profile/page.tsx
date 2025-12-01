'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings, Bell, MessageCircle, MapPin, User as UserIcon } from "lucide-react";
import { userService, User } from "@/services/user.service";

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

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await userService.getMe();
                setUser(data);
            } catch (error) {
                console.error("Failed to fetch user", error);
            }
        };
        fetchUser();
    }, []);

    const renderTabContent = () => {
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
            </div>
        </div>
    );
}
