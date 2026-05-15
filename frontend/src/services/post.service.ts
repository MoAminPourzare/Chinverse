import api from "@/lib/api";

export interface PostProvider {
    id: number;
    display_name?: string | null;
    avatar_url?: string | null;
    headline?: string | null;
}

export interface PostDetail {
    id: number;
    image_url: string;
    caption?: string | null;
    created_at?: string | null;
    likes_count: number;
    comments_count: number;
    provider?: PostProvider | null;
}

export const postService = {
    async getPost(postId: number): Promise<PostDetail> {
        const response = await api.get<PostDetail>(`/feed/posts/${postId}`);
        return response.data;
    },
};
