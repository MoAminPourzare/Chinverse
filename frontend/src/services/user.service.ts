import api from '@/lib/api';

// Resume Data Structures
export interface WorkExperience {
    company: string;
    job_title: string;
    start_date: string;
    end_date: string;
}

export interface Education {
    university: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
}

export interface Certificate {
    title: string;
    issuer: string;
    date: string;
}

export interface AwardItem {
    title: string;
    issuer: string;
    date: string;
}

export interface Skill {
    name: string;
    level: string;
}

export interface Language {
    name: string;
    level: string;
}

export interface ResumeData {
    work_experiences: WorkExperience[];
    educations: Education[];
    certificates: Certificate[];
    awards: AwardItem[];
    skills: Skill[];
    languages: Language[];
}

// اینترفیس مربوط به اطلاعات قابل ویرایش پروفایل
export interface UserProfile {
    display_name?: string;
    headline?: string;
    about_me?: string;
    phone?: string;
    is_verified?: boolean;
    country?: string;
    city?: string;
    website_url?: string;
    avatar_url?: string;
    bio?: string;
    websites?: string[];
    socials?: Array<{ platform: string; handle: string }>;
    resume?: ResumeData;
}

export interface User {
    id: string;
    email: string;
    phone?: string;
    profile?: UserProfile;
}

export const userService = {
    // دریافت اطلاعات کامل کاربر (شامل ایمیل + پروفایل)
    async getMe(): Promise<User> {
        const response = await api.get<User>('/users/me');
        return response.data;
    },

    // آپدیت کردن پروفایل
    // دقت کن: فقط فیلدهای UserProfile را می‌فرستیم، نه ایمیل و موبایل را
    async updateProfile(data: Partial<UserProfile>): Promise<User> {
        const response = await api.put<User>('/users/me/profile', data);
        return response.data;
    },

    // آپلود کردن آواتار
    async uploadAvatar(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<User>('/users/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // ===== PUBLIC ENDPOINTS =====

    // دریافت لیست کاربران برای ویترین
    async getShowcaseUsers(skip = 0, limit = 20): Promise<ShowcaseUser[]> {
        const response = await api.get<ShowcaseUser[]>('/users/showcase', {
            params: { skip, limit }
        });
        return response.data;
    },

    // دریافت پروفایل عمومی کاربر
    async getPublicProfile(userId: number): Promise<PublicUser> {
        const response = await api.get<PublicUser>(`/users/${userId}/public`);
        return response.data;
    },

    // ===== SERVICES ENDPOINTS =====

    // دریافت خدمات کاربر فعلی
    async getMyServices(): Promise<UserService[]> {
        const response = await api.get<UserService[]>('/users/me/services');
        return response.data;
    },

    // ایجاد خدمت جدید
    async createService(data: FormData): Promise<UserService> {
        const response = await api.post<UserService>('/users/me/services', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // حذف خدمت
    async deleteService(serviceId: number): Promise<void> {
        await api.delete(`/users/me/services/${serviceId}`);
    },

    // دریافت خدمات یک کاربر (عمومی)
    async getUserServices(userId: number): Promise<UserService[]> {
        const response = await api.get<UserService[]>(`/users/${userId}/services`);
        return response.data;
    },

    // دریافت همه خدمات عمومی برای ویترین
    async getPublicServices(skip = 0, limit = 50): Promise<ServiceWithProvider[]> {
        const response = await api.get<ServiceWithProvider[]>('/users/me/services/public', {
            params: { skip, limit }
        });
        return response.data;
    },

    async getPublicService(serviceId: number): Promise<ServiceWithProvider> {
        const response = await api.get<ServiceWithProvider>(`/users/me/services/public/${serviceId}`);
        return response.data;
    },

    // ===== NETWORKING / FOLLOWING =====

    // دریافت لیست شبکه من (افرادی که دنبال می‌کنم)
    async getMyNetwork(): Promise<NetworkUser[]> {
        const response = await api.get<NetworkUser[]>('/users/me/network');
        return response.data;
    },

    // دریافت لیست دنبال‌کنندگان من
    async getMyFollowers(): Promise<NetworkUser[]> {
        const response = await api.get<NetworkUser[]>('/users/me/followers');
        return response.data;
    },

    // دریافت لیست افرادی که دنبال می‌کنم
    async getMyFollowing(): Promise<NetworkUser[]> {
        const response = await api.get<NetworkUser[]>('/users/me/following');
        return response.data;
    },

    // دریافت تعداد دنبال‌کنندگان من
    async getMyFollowersCount(): Promise<number> {
        const response = await api.get<{ followers_count: number }>('/users/me/followers-count');
        return response.data.followers_count;
    },

    // دریافت تعداد افرادی که دنبال می‌کنم
    async getMyFollowingCount(): Promise<number> {
        const response = await api.get<{ following_count: number }>('/users/me/following-count');
        return response.data.following_count;
    },

    // دنبال کردن کاربر
    async followUser(userId: number): Promise<void> {
        await api.post(`/users/${userId}/follow`);
    },

    // لغو دنبال کردن کاربر
    async unfollowUser(userId: number): Promise<void> {
        await api.delete(`/users/${userId}/follow`);
    },

    // بررسی آیا کاربر را دنبال می‌کنم
    async isFollowing(userId: number): Promise<boolean> {
        const response = await api.get<{ is_following: boolean }>(`/users/${userId}/is-following`);
        return response.data.is_following;
    },

    // دریافت تعداد دنبال‌کنندگان کاربر
    async getFollowersCount(userId: number): Promise<number> {
        const response = await api.get<{ followers_count: number }>(`/users/${userId}/followers-count`);
        return response.data.followers_count;
    },

    // دریافت تعداد دنبال‌شوندگان کاربر
    async getFollowingCount(userId: number): Promise<number> {
        const response = await api.get<{ following_count: number }>(`/users/${userId}/following-count`);
        return response.data.following_count;
    },
};

// ===== SHOWCASE TYPES =====

export interface EducationSummary {
    university?: string;
    field?: string;
    degree?: string;
}

export interface ShowcaseUser {
    id: number;
    display_name?: string;
    headline?: string;
    city?: string;
    country?: string;
    avatar_url?: string;
    education?: EducationSummary;
    gallery_preview: string[];
    hsk_level?: string;
}

export interface GalleryItemPublic {
    id: number;
    image_url: string;
    caption?: string;
}

export interface PublicUser {
    id: number;
    profile?: UserProfile;
    gallery_items: GalleryItemPublic[];
}

// ===== SERVICE TYPES =====

export interface UserService {
    id: number;
    user_id: number;
    title: string;
    description: string;
    banner_url?: string;
    price_label?: string;
    created_at?: string;
}

export interface ServiceProvider {
    id: number;
    display_name?: string;
    avatar_url?: string;
    headline?: string;
}

export interface ServiceWithProvider {
    id: number;
    title: string;
    description: string;
    banner_url?: string;
    price_label?: string;
    created_at?: string;
    provider?: ServiceProvider;
}

// ===== NETWORK TYPES =====

export interface NetworkUser {
    id: number;
    display_name?: string;
    avatar_url?: string;
    headline?: string;
}
