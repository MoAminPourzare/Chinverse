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
};
