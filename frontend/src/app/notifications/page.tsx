"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BellRing,
    CheckCircle2,
    MessageCircle,
    RefreshCw,
    Sparkles,
    UserPlus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { BackButton } from "@/components/ui/IconButton";
import { getMediaUrl } from "@/lib/media";
import { AppNotification, notificationService, NotificationType } from "@/services/notification.service";

type NotificationGroup = {
    key: string;
    notification: AppNotification;
    count: number;
    unreadCount: number;
    ids: number[];
};

const iconByType: Record<NotificationType, typeof BellRing> = {
    message: MessageCircle,
    follow: UserPlus,
    post: Sparkles,
    forum: MessageCircle,
    service: CheckCircle2,
    system: BellRing,
};

const colorByType: Record<NotificationType, string> = {
    message: "bg-[#eef6ff] text-[#155aa6]",
    follow: "bg-emerald-50 text-emerald-700",
    post: "bg-amber-50 text-amber-700",
    forum: "bg-[#eef6ff] text-[#155aa6]",
    service: "bg-sky-50 text-sky-700",
    system: "bg-slate-100 text-slate-700",
};

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNotifications = useCallback(async () => {
        try {
            setError(null);
            const data = await notificationService.getNotifications(false);
            setNotifications(data);
        } catch (requestError) {
            console.error("Failed to fetch notifications", requestError);
            setError("ارتباط با اعلان‌ها برقرار نشد. چند لحظه بعد دوباره امتحان کن.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        loadNotifications();
        const interval = window.setInterval(loadNotifications, 15_000);
        return () => window.clearInterval(interval);
    }, [loadNotifications]);

    const groupedNotifications = useMemo(() => groupNotifications(notifications), [notifications]);

    const openNotification = async (group: NotificationGroup) => {
        setNotifications((items) =>
            items.map((item) => (group.ids.includes(item.id) ? { ...item, is_read: true } : item)),
        );

        await Promise.allSettled(
            group.ids.map((id) => notificationService.markRead(id)),
        );

        if (group.notification.target_url) {
            router.push(group.notification.target_url);
        }
    };

    return (
        <div className="min-h-full bg-[#f9fafc] px-5 pb-8 pt-4" dir="rtl">
            <header className="relative flex h-12 items-center justify-center">
                <BackButton onClick={() => router.back()} className="absolute right-0" />
                <h1 className="text-[18px] font-black text-[#2f3238]">اعلان‌ها</h1>
            </header>

            <main className="mt-6">
                {isLoading ? (
                    <div className="flex min-h-[560px] items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
                    </div>
                ) : error ? (
                    <EmptyNotifications
                        icon={<RefreshCw className="h-10 w-10 text-[#155aa6]" />}
                        title="اعلان‌ها باز نشد"
                        description={error}
                        action={
                            <button
                                type="button"
                                onClick={loadNotifications}
                                className="mt-6 rounded-full bg-[#155aa6] px-5 py-3 text-sm font-black text-white"
                            >
                                تلاش دوباره
                            </button>
                        }
                    />
                ) : groupedNotifications.length > 0 ? (
                    <div className="space-y-3">
                        {groupedNotifications.map((group) => (
                            <NotificationCard
                                key={group.key}
                                group={group}
                                onOpen={() => openNotification(group)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyNotifications
                        image="/assets/chinverse/icons/notification.svg"
                        title="هنوز هیچ اعلانی نداری!"
                    />
                )}
            </main>
        </div>
    );
}

function groupNotifications(items: AppNotification[]): NotificationGroup[] {
    const groups = new Map<string, NotificationGroup>();

    for (const item of items) {
        const key = item.type === "message"
            ? `message:${item.actor?.id ?? item.target_url ?? "unknown"}`
            : `${item.type}:${item.id}`;

        const current = groups.get(key);

        if (!current) {
            groups.set(key, {
                key,
                notification: item,
                count: 1,
                unreadCount: item.is_read ? 0 : 1,
                ids: [item.id],
            });
            continue;
        }

        current.count += 1;
        current.unreadCount += item.is_read ? 0 : 1;
        current.ids.push(item.id);

        if (new Date(item.created_at).getTime() > new Date(current.notification.created_at).getTime()) {
            current.notification = item;
        }
    }

    return Array.from(groups.values()).sort(
        (a, b) => new Date(b.notification.created_at).getTime() - new Date(a.notification.created_at).getTime(),
    );
}

function EmptyNotifications({
    image,
    icon,
    title,
    description,
    action,
}: {
    image?: string;
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex min-h-[560px] flex-col items-center justify-center px-6 text-center">
            {image ? (
                <div className="relative mb-8 h-[150px] w-[150px]">
                    <Image src={image} alt="" fill sizes="150px" className="object-contain" />
                </div>
            ) : (
                <div className="mb-8 flex h-[110px] w-[110px] items-center justify-center rounded-[32px] bg-[#eef6ff]">
                    {icon}
                </div>
            )}
            <h2 className="text-[17px] font-black text-[#25272d]">{title}</h2>
            {description && (
                <p className="mt-4 max-w-[300px] text-[12px] font-medium leading-7 text-[#858b96]">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}

function NotificationCard({
    group,
    onOpen,
}: {
    group: NotificationGroup;
    onOpen: () => void;
}) {
    const notification = group.notification;
    const Icon = iconByType[notification.type] || BellRing;
    const actorName = notification.actor?.display_name || "چین‌ورس";
    const avatarUrl = getMediaUrl(notification.actor?.avatar_url);
    const isUnread = group.unreadCount > 0;

    const title = notification.type === "message" && group.count > 1
        ? `${actorName} ${group.count} پیام فرستاده`
        : notification.title;

    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                "relative w-full overflow-hidden rounded-[24px] border bg-white p-4 text-right shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.10)]",
                isUnread ? "border-[#cfe2f7]" : "border-slate-100",
            )}
        >
            {isUnread && (
                <span className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full bg-[#155aa6] shadow-[0_0_0_5px_rgba(21,90,166,0.12)]" />
            )}
            <div className="flex items-start gap-3">
                <div className={cn("relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px]", colorByType[notification.type] || colorByType.system)}>
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={actorName}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                        />
                    ) : (
                        <Icon size={22} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <p className="line-clamp-1 text-sm font-black text-slate-950">{title}</p>
                        <time className="shrink-0 text-[11px] font-bold text-slate-400">
                            {formatRelativeTime(notification.created_at)}
                        </time>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-600">
                        {notification.body || "یک اعلان جدید داری."}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-[11px] font-black text-[#155aa6]">
                            {typeLabel(notification.type)}
                        </span>
                        {notification.type === "message" && group.count > 1 && (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                                {group.count} پیام
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}

function formatRelativeTime(value: string) {
    const date = new Date(value).getTime();
    const diffMs = Date.now() - date;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < minute) return "همین الان";
    if (diffMs < hour) return `${Math.floor(diffMs / minute)} دقیقه پیش`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)} ساعت پیش`;
    if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} روز پیش`;

    return new Date(value).toLocaleDateString("fa-IR", {
        month: "short",
        day: "numeric",
    });
}

function typeLabel(type: NotificationType) {
    const labels: Record<NotificationType, string> = {
        message: "پیام",
        follow: "دنبال‌کننده",
        post: "فعالیت",
        forum: "گفتگو",
        service: "خدمات",
        system: "سیستم",
    };
    return labels[type] || labels.system;
}
