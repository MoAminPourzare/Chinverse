import api from '@/lib/api';

export interface UserProfile {
    display_name: string;
    headline?: string;
    about_me?: string;
    country?: string;
    city?: string;
    website_url?: string;
    avatar_url?: string;
}

export interface User {
    id: number;
    email: string;
    phone: string;
    is_verified: boolean;
    profile?: UserProfile;
}

export const userService = {
    async getMe(): Promise<User> {
        const response = await api.get<User>('/users/me');
        return response.data;
    },

    async updateProfile(data: UserProfile): Promise<User> {
        const response = await api.put<User>('/users/me/profile', data);
        return response.data;
    },
};
