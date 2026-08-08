import api, { resolveWebSocketBaseUrl } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-session';

// ===== TYPES =====

export interface ChatUserSummary {
    id: number;
    display_name: string | null;
    avatar_url: string | null;
}

export interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    is_read: boolean;
    created_at: string;
    sender: ChatUserSummary | null;
    receiver: ChatUserSummary | null;
}

export interface ConversationPreview {
    user: ChatUserSummary;
    last_message: string;
    last_message_time: string;
    unread_count: number;
    is_online?: boolean;
}

export interface SendMessageRequest {
    receiver_id: number;
    content: string;
}

export interface MarkConversationReadResponse {
    updated: number;
    message_ids: number[];
}

// ===== SERVICE =====

export const chatService = {
    async sendMessage(data: SendMessageRequest): Promise<ChatMessage> {
        const response = await api.post<ChatMessage>('/chat', data);
        return response.data;
    },

    async getConversations(): Promise<ConversationPreview[]> {
        const response = await api.get<ConversationPreview[]>('/chat/conversations');
        return response.data;
    },

    async getMessageHistory(userId: number, skip = 0, limit = 50): Promise<ChatMessage[]> {
        const response = await api.get<ChatMessage[]>(`/chat/${userId}/messages`, {
            params: { skip, limit }
        });
        return response.data;
    },

    async getNewMessages(userId: number, afterId: number): Promise<ChatMessage[]> {
        const response = await api.get<ChatMessage[]>(`/chat/${userId}/messages`, {
            params: { after_id: afterId, limit: 100 }
        });
        return response.data;
    },

    async markConversationRead(userId: number): Promise<MarkConversationReadResponse> {
        const response = await api.post<MarkConversationReadResponse>(`/chat/${userId}/read`);
        return response.data;
    },

    getWebSocketUrl(): string | null {
        if (typeof window === 'undefined') return null;
        return `${resolveWebSocketBaseUrl()}/chat/ws`;
    },

    getWebSocketAuthToken(): string | null {
        return getAccessToken();
    },
};
