import api from '@/lib/api';

// اینترفیس مربوط به اطلاعات قابل ویرایش پروفایل
export interface UserProfile {
    display_name?: string;
    headline?: string;
    about_me?: string;
    country?: string;
    city?: string;
    website_url?: string;
    avatar_url?: string;
}

// اینترفیس کلی کاربر (همان چیزی که بک‌ند برمی‌گرداند)
export interface User {
    id: number;
    email: string;
    phone: string;
    is_verified: boolean;
    // پروفایل به صورت یک آبجکت تو در تو است
    profile?: UserProfile;
    // Some backends might return display_name at the top level too, but we will rely on profile for edits if that's the contract.
    // However, the user request says "Contains editable fields (display_name...)" in UserProfile.
    // And "User: Contains read-only fields (id, email, phone) and a nested profile".
    // So we will stick to that structure.
}

export const userService = {
    // دریافت اطلاعات کامل کاربر (شامل ایمیل + پروفایل)
    async getMe(): Promise<User> {
        const response = await api.get<User>('/users/me');
        return response.data;
    },

    // آپدیت کردن پروفایل
    // دقت کن: فقط فیلدهای UserProfile را می‌فرستیم، نه ایمیل و موبایل را
    async updateProfile(data: UserProfile): Promise<User> {
        const response = await api.put<User>('/users/me/profile', data);
        return response.data;
    },
};
