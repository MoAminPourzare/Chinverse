import api from '@/lib/api';

// ===== TYPES =====

export interface UserSummary {
    id: number;
    display_name: string | null;
    avatar_url: string | null;
}

export interface ForumQuestion {
    id: number;
    title: string;
    content: string;
    author_user_id: number;
    created_at: string;
    author: UserSummary | null;
    answers_count: number;
}

export interface ForumQuestionCreate {
    title: string;
    content: string;
}

export interface Article {
    id: number;
    title: string;
    summary: string | null;
    content: string;
    cover_image: string | null;
    created_at: string;
}

export interface SupportTicketCreate {
    message: string;
}

export interface SupportTicketResponse {
    success: boolean;
    message: string;
    ticket_id: number;
}

// ===== SERVICE =====

export const communityService = {
    // Forum Questions
    async getForumQuestions(skip = 0, limit = 20): Promise<ForumQuestion[]> {
        const response = await api.get<ForumQuestion[]>('/community/forum/questions', {
            params: { skip, limit }
        });
        return response.data;
    },

    async createForumQuestion(data: ForumQuestionCreate): Promise<ForumQuestion> {
        const response = await api.post<ForumQuestion>('/community/forum/questions', data);
        return response.data;
    },

    // Articles
    async getArticles(skip = 0, limit = 20): Promise<Article[]> {
        const response = await api.get<Article[]>('/community/forum/articles', {
            params: { skip, limit }
        });
        return response.data;
    },

    // Support
    async submitSupportTicket(data: SupportTicketCreate): Promise<SupportTicketResponse> {
        const response = await api.post<SupportTicketResponse>('/community/support', data);
        return response.data;
    },
};
