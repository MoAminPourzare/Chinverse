"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    BellRing,
    CheckCheck,
    CheckCircle2,
    MessageCircle,
    RefreshCw,
    Sparkles,
    UserPlus,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { AppNotification, notificationService, NotificationType } from "@/services/notification.service";

const iconByType: Record<NotificationType, typeof BellRing> = {
    message: MessageCircle,
    follow: UserPlus,
    post: Sparkles,
    forum: MessageCircle,
    service: CheckCircle2,
    system: BellRing,
};

const colorByType: Record<NotificationType, string> = {
    message: "from-sky-100 to-blue-50 text-sky-700",
    follow: "from-emerald-100 to-teal-50 text-emerald-700",
    post: "from-amber-100 to-orange-50 text-amber-700",
    forum: "from-violet-100 to-fuchsia-50 text-violet-700",
    service: "from-rose-100 to-pink-50 text-rose-700",
    system: "from-slate-100 to-slate-50 text-slate-700",
};

type FilterKey = "all" | "unread";

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [filter, setFilter] = useState<FilterKey>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            setError(null);
            const data = await notificationService.getNotifications(filter === "unread");
            setNotifications(data);
        } catch (requestError) {
            console.error("Failed to fetch notifications", requestError);
            setError("ارتباط با اعلان‌ها برقرار نشد. چند لحظه بعد دوباره امتحان کن.");
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        setIsLoading(true);
        loadNotifications();
        const interval = window.setInterval(loadNotifications, 15_000);
        return () => window.clearInterval(interval);
    }, [loadNotifications]);

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.is_read).length,
        [notifications],
    );

    const markAllRead = async () => {
        if (isMarkingAll || unreadCount === 0) return;
        setIsMarkingAll(true);
        try {
            await notificationService.markAllRead();
            setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
        } catch (markError) {
            console.error("Failed to mark notifications as read", markError);
        } finally {
            setIsMarkingAll(false);
        }
    };

    const openNotification = async (notification: AppNotification) => {
        if (!notification.is_read) {
            setNotifications((items) =>
                items.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
            );
            try {
                await notificationService.markRead(notification.id);
            } catch (markError) {
                console.error("Failed to mark notification as read", markError);
            }
        }

        if (notification.target_url) {
            router.push(notification.target_url);
        }
    };

    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <section className="overflow-hidden rounded-[30px] border border-slate-800 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                <div className="relative p-5">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#862633_54%,#f59e0b_135%)]" />
                    <div className="absolute -left-14 -top-8 h-44 w-44 rounded-full bg-rose-400/30 blur-3xl" />
                    <div className="absolute -bottom-16 right-10 h-44 w-44 rounded-full bg-amber-300/25 blur-3xl" />
                    <div className="relative">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <Link
                                href="/profile"
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                                aria-label="بازگشت"
                            >
                                <ArrowRight size={19} />
                            </Link>
                            <button
                                type="button"
                                onClick={markAllRead}
                                disabled={isMarkingAll || unreadCount === 0}
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white/[0.85] transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                <CheckCheck size={15} />
                                خواندن همه
                            </button>
                        </div>

                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-black text-amber-100">مرکز اعلان‌ها</p>
                                <h1 className="mt-2 text-2xl font-black tracking-tight">اعلان‌های تو</h1>
                                <p className="mt-3 max-w-[280px] text-sm leading-7 text-white/75">
                                    پیام‌ها، دنبال‌کننده‌ها و اتفاق‌های مهم حساب کاربری اینجا جمع می‌شوند.
                                </p>
                            </div>
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-white/15 bg-white/[0.12] shadow-inner">
                                <BellRing size={27} />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <StatPill label="همه اعلان‌ها" value={notifications.length} />
                            <StatPill label="خوانده‌نشده" value={unreadCount} hot={unreadCount > 0} />
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto mt-5 w-full max-w-2xl">
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white p-1 shadow-sm">
                    <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                        همه
                    </FilterButton>
                    <FilterButton active={filter === "unread"} onClick={() => setFilter("unread")}>
                        خوانده‌نشده
                    </FilterButton>
                </div>

                {isLoading ? (
                    <Surface className="flex min-h-[300px] items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                    </Surface>
                ) : error ? (
                    <EmptyState
                        icon={<RefreshCw size={30} />}
                        title="اعلان‌ها باز نشد"
                        description={error}
                        action={<PrimaryButton onClick={loadNotifications}>تلاش دوباره</PrimaryButton>}
                    />
                ) : notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onOpen={() => openNotification(notification)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<BellRing size={30} />}
                        title={filter === "unread" ? "اعلان خوانده‌نشده نداری" : "فعلاً اعلانی نداری"}
                        description="وقتی پیام جدید، دنبال‌کننده تازه یا رویداد مهمی داشته باشی، اینجا نمایش داده می‌شود."
                    />
                )}
            </main>
        </div>
    );
}

function StatPill({ label, value, hot = false }: { label: string; value: number; hot?: boolean }) {
    return (
        <div className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-3">
            <p className="text-[11px] font-bold text-white/[0.65]">{label}</p>
            <p className={cn("mt-1 text-xl font-black", hot ? "text-amber-200" : "text-white")}>{value}</p>
        </div>
    );
}

function FilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-[18px] px-3 py-2.5 text-sm font-black transition",
                active ? "bg-slate-950 text-white shadow-lg shadow-slate-900/15" : "text-slate-500 hover:bg-slate-50",
            )}
        >
            {children}
        </button>
    );
}

function NotificationCard({
    notification,
    onOpen,
}: {
    notification: AppNotification;
    onOpen: () => void;
}) {
    const Icon = iconByType[notification.type] || BellRing;
    const actorName = notification.actor?.display_name || "چین ورس";
    const avatarUrl = getMediaUrl(notification.actor?.avatar_url);

    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                "group relative w-full overflow-hidden rounded-[26px] border bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl",
                notification.is_read ? "border-slate-100" : "border-rose-100 shadow-rose-100/60",
            )}
        >
            {!notification.is_read && (
                <span className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_5px_rgba(244,63,94,0.12)]" />
            )}
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br",
                        colorByType[notification.type] || colorByType.system,
                    )}
                >
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
                        <p className="line-clamp-1 text-sm font-black text-slate-950">{notification.title}</p>
                        <time className="shrink-0 text-[11px] font-bold text-slate-400">
                            {formatRelativeTime(notification.created_at)}
                        </time>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-600">
                        {notification.body || "یک اعلان جدید داری."}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                            {typeLabel(notification.type)}
                        </span>
                        <span className="text-[11px] font-black text-rose-600 opacity-0 transition group-hover:opacity-100">
                            مشاهده
                        </span>
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
