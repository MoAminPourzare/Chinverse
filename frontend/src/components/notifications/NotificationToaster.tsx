"use client";

import Image from "@/components/ui/PublicMediaImage";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, MessageCircle, ShieldAlert, Sparkles, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { AppNotification, notificationService, NotificationType } from "@/services/notification.service";
import { authService } from "@/services/auth.service";
import { useAdaptivePolling } from "@/hooks/useAdaptivePolling";

const STORAGE_KEY = "chinverse:lastSeenNotificationId";
const HIDDEN_PREFIXES = ["/login", "/signup", "/notifications"];

const iconByType: Record<NotificationType, typeof Bell> = {
    message: MessageCircle,
    follow: UserPlus,
    post: Sparkles,
    forum: MessageCircle,
    service: CheckCircle2,
    moderation: ShieldAlert,
    system: Bell,
};

export default function NotificationToaster() {
    const router = useRouter();
    const pathname = usePathname();
    const [notification, setNotification] = useState<AppNotification | null>(null);
    const [extraCount, setExtraCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const lastSeenRef = useRef<number | null>(null);
    const initializedRef = useRef(false);
    const hideTimerRef = useRef<number | null>(null);

    const shouldRun = useMemo(() => {
        if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
        return isAuthenticated;
    }, [isAuthenticated, pathname]);

    useEffect(() => {
        let isMounted = true;
        const syncAuth = async () => {
            const authenticated = await authService.restoreSession();
            if (isMounted) setIsAuthenticated(authenticated);
        };

        void syncAuth();
        window.addEventListener("chinverse-auth-change", syncAuth);
        return () => {
            isMounted = false;
            window.removeEventListener("chinverse-auth-change", syncAuth);
        };
    }, []);

    useEffect(() => {
        if (!shouldRun) return;
        try {
            const stored = Number(localStorage.getItem(STORAGE_KEY));
            lastSeenRef.current = Number.isFinite(stored) && stored > 0 ? stored : null;
        } catch {
            lastSeenRef.current = null;
        }

        return () => {
            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
        };
    }, [shouldRun]);

    useAdaptivePolling({
        enabled: shouldRun,
        task: async (signal) => {
            const items = await notificationService.getLatest(lastSeenRef.current, signal);
            if (items.length === 0) {
                initializedRef.current = true;
                return false;
            }

            const maxId = Math.max(...items.map((item) => item.id));
            lastSeenRef.current = maxId;
            try {
                localStorage.setItem(STORAGE_KEY, String(maxId));
            } catch {
                // Storage can be unavailable in private mode; in-memory tracking still works.
            }

            if (!initializedRef.current) {
                initializedRef.current = true;
                return true;
            }

            const ordered = [...items].sort((a, b) => a.id - b.id);
            setNotification(ordered[ordered.length - 1]);
            setExtraCount(Math.max(0, ordered.length - 1));
            setIsVisible(true);

            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = window.setTimeout(() => setIsVisible(false), 6500);
            return true;
        },
        baseIntervalMs: 12_000,
        maxIntervalMs: 60_000,
    });

    if (!notification) return null;

    const Icon = iconByType[notification.type] || Bell;
    const actorName = notification.actor?.display_name || "چین ورس";
    const avatarUrl = getMediaUrl(notification.actor?.avatar_url);

    const openNotification = async () => {
        setIsVisible(false);
        try {
            await notificationService.markRead(notification.id);
        } catch {
            // The navigation still matters more than marking read here.
        }
        if (notification.target_url) {
            router.push(notification.target_url);
        } else {
            router.push("/notifications");
        }
    };

    return (
        <div
            dir="rtl"
            className={cn(
                "absolute left-3 right-3 top-[calc(env(safe-area-inset-top)+12px)] z-[90] transition-all duration-300",
                isVisible ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0 pointer-events-none",
            )}
        >
            <div className="overflow-hidden rounded-[26px] border border-white/70 bg-white/[0.92] shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur-xl">
                <div className="flex items-center gap-2 p-2 transition hover:bg-[#eef6ff]/80">
                    <button
                        type="button"
                        onClick={openNotification}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] p-1 text-right"
                    >
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#eef6ff] to-[#fff6df] text-[#155aa6]">
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt={actorName}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                    unoptimized
                                />
                            ) : (
                                <Icon size={20} />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#155aa6]" />
                                <p className="truncate text-sm font-black text-slate-950">{notification.title}</p>
                                {extraCount > 0 && (
                                    <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white">
                                        +{extraCount}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                                {notification.body || "یک اعلان جدید داری."}
                            </p>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsVisible(false);
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="بستن اعلان"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
