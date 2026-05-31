import api, { clearApiCache } from '@/lib/api';

export interface LoginRequest {
    username: string; // در اینجا ایمیل کاربر قرار می‌گیرد
    password: string;
}

export interface SignupRequest {
    email: string;
    password: string;
    referral_code?: string;
    phone: string;        // اضافه شد: چون در بک‌ند اجباری است
    display_name?: string; // اصلاح شد: در بک‌ند نامش display_name است
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

const notifyAuthChanged = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('chinverse-auth-change'));
};

export const authService = {
    // تابع لاگین
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        // تبدیل جیسون به فرم‌دیتا برای استاندارد OAuth2
        const params = new URLSearchParams();
        params.append('username', credentials.username);
        params.append('password', credentials.password);

        const response = await api.post<AuthResponse>('/login/access-token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // ذخیره توکن در لوکال استوریج
        if (response.data.access_token) {
            clearApiCache();
            localStorage.setItem('token', response.data.access_token);
            notifyAuthChanged();
        }
        return response.data;
    },

    // تابع ثبت‌نام
    async signup(data: SignupRequest): Promise<unknown> {
        // FIX: آدرس از /users/signup به /signup تغییر کرد
        const response = await api.post('/signup', data);
        return response.data;
    },

    // خروج
    logout() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('token');
        clearApiCache();
        notifyAuthChanged();
    },
};
