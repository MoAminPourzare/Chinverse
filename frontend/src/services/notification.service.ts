import api from "@/lib/api";

export type NotificationType = "message" | "follow" | "post" | "forum" | "service" | "system";

export interface NotificationActor {
    id: number;
    display_name: string | null;
    avatar_url: string | null;
}

export interface AppNotification {
    id: number;
    type: NotificationType;
    title: string;
    body: string | null;
    target_url: string | null;
    metadata: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
    actor: NotificationActor | null;
}

export const notificationService = {
    async getNotifications(unreadOnly = false, skip = 0, limit = 40): Promise<AppNotification[]> {
        const response = await api.get<AppNotification[]>("/notifications", {
            params: { unread_only: unreadOnly, skip, limit },
        });
        return response.data;
    },

    async getLatest(afterId?: number | null): Promise<AppNotification[]> {
        const response = await api.get<AppNotification[]>("/notifications/latest", {
            params: afterId ? { after_id: afterId } : {},
        });
        return response.data;
    },

    async getUnreadCount(): Promise<number> {
        const response = await api.get<{ count: number }>("/notifications/unread-count");
        return response.data.count;
    },

    async markRead(notificationId: number): Promise<void> {
        await api.post(`/notifications/${notificationId}/read`);
    },

    async markAllRead(): Promise<number> {
        const response = await api.post<{ updated: number }>("/notifications/read-all");
        return response.data.updated;
    },
};
