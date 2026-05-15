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

export interface ForumAnswer {
    id: number;
    question_id: number;
    author_user_id: number;
    parent_id: number | null;
    content: string;
    created_at: string;
    author: UserSummary | null;
}

export interface ForumAnswerCreate {
    content: string;
    parent_id?: number | null;
}

export interface ForumQuestionDetail extends ForumQuestion {
    answers: ForumAnswer[];
}

export interface Article {
    id: number;
    title: string;
    summary: string | null;
    content: string;
    cover_image: string | null;
    author_user_id: number | null;
    author: UserSummary | null;
    created_at: string;
    comments_count: number;
}

export interface ArticleCreate {
    title: string;
    summary?: string | null;
    content: string;
    cover_image?: string | null;
}

export interface ArticleComment {
    id: number;
    article_id: number;
    author_user_id: number;
    parent_id: number | null;
    content: string;
    created_at: string;
    author: UserSummary | null;
}

export interface ArticleCommentCreate {
    content: string;
    parent_id?: number | null;
}

export interface ArticleDetail extends Article {
    comments: ArticleComment[];
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

    async getForumQuestion(questionId: number): Promise<ForumQuestionDetail> {
        const response = await api.get<ForumQuestionDetail>(`/community/forum/questions/${questionId}`);
        return response.data;
    },

    async createForumAnswer(questionId: number, data: ForumAnswerCreate): Promise<ForumAnswer> {
        const response = await api.post<ForumAnswer>(`/community/forum/questions/${questionId}/answers`, data);
        return response.data;
    },

    // Articles
    async getArticles(skip = 0, limit = 20): Promise<Article[]> {
        const response = await api.get<Article[]>('/community/forum/articles', {
            params: { skip, limit }
        });
        return response.data;
    },

    async createArticle(data: ArticleCreate): Promise<Article> {
        const response = await api.post<Article>('/community/forum/articles', data);
        return response.data;
    },

    async getArticle(articleId: number): Promise<ArticleDetail> {
        const response = await api.get<ArticleDetail>(`/community/forum/articles/${articleId}`);
        return response.data;
    },

    async createArticleComment(articleId: number, data: ArticleCommentCreate): Promise<ArticleComment> {
        const response = await api.post<ArticleComment>(`/community/forum/articles/${articleId}/comments`, data);
        return response.data;
    },

    // Support
    async submitSupportTicket(data: SupportTicketCreate): Promise<SupportTicketResponse> {
        const response = await api.post<SupportTicketResponse>('/community/support', data);
        return response.data;
    },
};
