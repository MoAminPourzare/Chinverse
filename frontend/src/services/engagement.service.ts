import api from "@/lib/api";

export type EngagementTargetType = "post" | "service" | "course";

export interface EngagementState {
    target_type: EngagementTargetType;
    target_id: number;
    liked: boolean;
    likes_count: number;
    comments_count: number;
}

export interface EngagementUserSummary {
    id: number;
    display_name?: string | null;
    avatar_url?: string | null;
}

export interface EngagementComment {
    id: number;
    target_type: EngagementTargetType;
    target_id: number;
    user_id: number;
    parent_id?: number | null;
    content: string;
    created_at: string;
    author?: EngagementUserSummary | null;
}

export const engagementService = {
    async getState(targetType: EngagementTargetType, targetId: number): Promise<EngagementState> {
        const response = await api.get<EngagementState>(`/engagements/${targetType}/${targetId}`);
        return response.data;
    },

    async like(targetType: EngagementTargetType, targetId: number): Promise<EngagementState> {
        const response = await api.post<EngagementState>(`/engagements/${targetType}/${targetId}/like`);
        return response.data;
    },

    async unlike(targetType: EngagementTargetType, targetId: number): Promise<EngagementState> {
        const response = await api.delete<EngagementState>(`/engagements/${targetType}/${targetId}/like`);
        return response.data;
    },

    async getComments(targetType: EngagementTargetType, targetId: number): Promise<EngagementComment[]> {
        const response = await api.get<EngagementComment[]>(`/engagements/${targetType}/${targetId}/comments`);
        return response.data;
    },

    async createComment(
        targetType: EngagementTargetType,
        targetId: number,
        content: string,
        parentId?: number | null,
    ): Promise<EngagementComment> {
        const response = await api.post<EngagementComment>(`/engagements/${targetType}/${targetId}/comments`, {
            content,
            parent_id: parentId ?? null,
        });
        return response.data;
    },
};
