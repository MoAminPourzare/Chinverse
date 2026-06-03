'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User as UserIcon, UsersRound } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { useOptionalCurrentUserId } from "@/hooks/useOptionalCurrentUserId";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getProfileHref } from "@/utils/profileHref";
import { NetworkUser, userService } from "@/services/user.service";

type TabType = "followers" | "following";

export default function NetworkPage() {
    const [activeTab, setActiveTab] = useState<TabType>("followers");
    const [followers, setFollowers] = useState<NetworkUser[]>([]);
    const [following, setFollowing] = useState<NetworkUser[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = useOptionalCurrentUserId();

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
            setFollowing((prev) => prev.filter((user) => user.id !== userId));
        } catch (error) {
            console.error("Failed to unfollow", error);
        }
    };

    const currentList = activeTab === "followers" ? followers : following;

    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <PageHeader title="شبکه من" subtitle="دنبال‌کننده‌ها و افرادی که دنبال می‌کنی" backHref="/profile" />

            <main className="mx-auto mt-5 flex w-full max-w-3xl flex-col gap-4">
                <Surface className="grid grid-cols-2 gap-2 p-2">
                    <TabButton
                        active={activeTab === "followers"}
                        onClick={() => setActiveTab("followers")}
                        label={`دنبال‌کننده‌ها (${followers.length})`}
                    />
                    <TabButton
                        active={activeTab === "following"}
                        onClick={() => setActiveTab("following")}
                        label={`دنبال‌شونده‌ها (${following.length})`}
                    />
                </Surface>

                {loading ? (
                    <div className="grid gap-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Surface key={index} className="h-24 animate-pulse p-4">
                                <div className="h-full rounded-[20px] bg-slate-100" />
                            </Surface>
                        ))}
                    </div>
                ) : currentList.length === 0 ? (
                    <EmptyState
                        icon={<UsersRound size={30} />}
                        title={activeTab === "followers" ? "هنوز دنبال‌کننده‌ای نداری" : "هنوز کسی را دنبال نمی‌کنی"}
                        description={activeTab === "followers" ? "وقتی کاربران پروفایلت را دنبال کنند، اینجا نمایش داده می‌شوند." : "از ویترین می‌تونی کاربران و متخصص‌های فعال را پیدا کنی."}
                        action={activeTab === "following" ? <PrimaryButton href="/showcase">رفتن به ویترین</PrimaryButton> : undefined}
                    />
                ) : (
                    <div className="grid gap-3">
                        {currentList.map((user) => {
                            const profileHref = getProfileHref(user.id, currentUserId);

                            return (
                            <Surface key={user.id} className="p-4">
                                <div className="flex items-center gap-3">
                                    <Link href={profileHref} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                        {user.avatar_url ? (
                                            <Image
                                                src={getMediaUrl(user.avatar_url)}
                                                alt={user.display_name || "کاربر"}
                                                fill
                                                className="object-cover"
                                                sizes="56px"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <UserIcon className="h-7 w-7 text-slate-400" />
                                            </div>
                                        )}
                                    </Link>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold text-slate-950">
                                            {user.display_name || "کاربر چین‌ورس"}
                                        </p>
                                        {user.headline && (
                                            <p className="mt-1 truncate text-sm text-slate-500">
                                                {user.headline}
                                            </p>
                                        )}
                                    </div>

                                    {activeTab === "following" ? (
                                        <button
                                            type="button"
                                            onClick={() => handleUnfollow(user.id)}
                                            className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                                        >
                                            دنبال نکردن
                                        </button>
                                    ) : (
                                        <Link
                                            href={profileHref}
                                            className="rounded-2xl bg-[#155aa6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0f4e92]"
                                        >
                                            مشاهده
                                        </Link>
                                    )}
                                </div>
                            </Surface>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-[22px] px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6]",
                active
                    ? "bg-[#155aa6] text-white shadow-[0_12px_26px_rgba(21,90,166,0.18)]"
                    : "text-slate-500 hover:bg-[#eef6ff] hover:text-[#155aa6]",
            )}
        >
            {label}
        </button>
    );
}
