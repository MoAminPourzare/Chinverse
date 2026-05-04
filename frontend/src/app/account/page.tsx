'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Pencil, User as UserIcon, Loader2, LogOut } from "lucide-react";
import { userService, UserProfile } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { getMediaUrl } from "@/lib/media";

// Local interface for form state, combining UserProfile and read-only User fields
interface AccountFormState extends UserProfile {
    email: string;
    phone: string;
}

export default function AccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Initial state
    const [formData, setFormData] = useState<AccountFormState>({
        display_name: "",
        headline: "",
        city: "",
        email: "",
        phone: "",
        avatar_url: "",
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await userService.getMe();
                setFormData({
                    display_name: userData.profile?.display_name || "",
                    headline: userData.profile?.headline || "",
                    city: userData.profile?.city || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                    avatar_url: userData.profile?.avatar_url || "",
                });
            } catch (error) {
                console.error("Failed to fetch user", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // فقط فایل‌های تصویری
            if (!file.type.startsWith('image/')) {
                alert('لطفاً یک فایل تصویری انتخاب کنید');
                return;
            }

            setAvatarFile(file);

            // ایجاد پیش‌نمایش
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // اول آواتار را آپلود می‌کنیم (اگر انتخاب شده باشد)
            if (avatarFile) {
                await userService.uploadAvatar(avatarFile);
            }

            // سپس پروفایل را آپدیت می‌کنیم
            const profileData: UserProfile = {
                display_name: formData.display_name,
                headline: formData.headline,
                city: formData.city,
            };

            await userService.updateProfile(profileData);
            alert("تغییرات با موفقیت ذخیره شد");

            // پاک کردن فایل و پیش‌نمایش بعد از موفقیت
            setAvatarFile(null);
            setAvatarPreview(null);

            // بارگذاری مجدد اطلاعات کاربر
            const userData = await userService.getMe();
            setFormData({
                display_name: userData.profile?.display_name || "",
                headline: userData.profile?.headline || "",
                city: userData.profile?.city || "",
                email: userData.email || "",
                phone: userData.phone || "",
                avatar_url: userData.profile?.avatar_url || "",
            });
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("خطا در ذخیره تغییرات");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-full bg-gray-50" dir="rtl">
                <Loader2 className="animate-spin text-gray-600 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 font-sans" dir="rtl">
            <div className="w-full bg-white min-h-full pb-8">

                {/* Header */}
                <header className="flex items-center justify-between p-6">
                    <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                        <ArrowRight className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">حساب کاربری</h1>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-700" title="خروج">
                        <LogOut className="w-5 h-5" />
                    </button>
                </header>

                <div className="px-8">
                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="relative mb-4 cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-28 h-28 rounded-full border-2 border-blue-700 p-1.5 relative">
                                <div className="w-full h-full rounded-full bg-orange-200 flex items-center justify-center overflow-hidden relative z-10 text-orange-500">
                                    {avatarPreview ? (
                                        <Image
                                            src={avatarPreview}
                                            alt="Preview"
                                            width={112}
                                            height={112}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : formData.avatar_url ? (
                                        <Image
                                            src={getMediaUrl(formData.avatar_url)}
                                            alt="Profile"
                                            width={112}
                                            height={112}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <UserIcon className="w-14 h-14" />
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            className="flex items-center text-gray-700 text-sm font-bold gap-2 hover:text-blue-600 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            <span>ویرایش تصویر پروفایل</span>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Name - Orange Border */}
                        <div className="relative group">
                            <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-orange-500">
                                نام و نام خانوادگی
                            </label>
                            <input
                                type="text"
                                name="display_name"
                                value={formData.display_name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 text-center font-bold focus:outline-none focus:ring-0 focus:border-orange-500 transition-colors placeholder-gray-300"
                                placeholder="نام خود را وارد کنید"
                            />
                        </div>

                        {/* Headline - Blue Border */}
                        <div className="relative group">
                            <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-blue-700">
                                عنوان شغلی
                            </label>
                            <input
                                type="text"
                                name="headline"
                                value={formData.headline}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 text-center font-bold focus:outline-none focus:ring-0 focus:border-blue-700 transition-colors placeholder-gray-300"
                                placeholder="عنوان شغلی"
                            />
                        </div>

                        {/* Location - Orange Border */}
                        <div className="relative group">
                            <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-orange-500">
                                لوکیشن
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 text-center font-bold focus:outline-none focus:ring-0 focus:border-orange-500 transition-colors placeholder-gray-300"
                                placeholder="شهر / کشور"
                            />
                        </div>

                        {/* Mobile - Blue Border */}
                        <div className="relative group">
                            <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-blue-700">
                                شماره موبایل
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                readOnly
                                dir="ltr"
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-gray-500 text-center font-bold focus:outline-none bg-gray-50 cursor-not-allowed"
                                placeholder="+98 900 000 0000"
                            />
                        </div>

                        {/* Email - Orange Border */}
                        <div className="relative group">
                            <label className="absolute -top-3 right-4 bg-white px-2 text-sm font-bold text-gray-600 z-10 group-focus-within:text-orange-500">
                                ایمیل
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                readOnly
                                dir="ltr"
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-gray-500 text-center font-bold focus:outline-none bg-gray-50 cursor-not-allowed"
                                placeholder="example@mail.com"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-800 transition-colors disabled:opacity-70 flex justify-center items-center"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin ml-2 h-5 w-5" />
                                        <span>در حال ذخیره...</span>
                                    </>
                                ) : (
                                    "ذخیره تغییرات"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
