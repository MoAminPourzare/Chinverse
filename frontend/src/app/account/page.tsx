"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Loader2, LogOut, Pencil, User as UserIcon, Mail, MapPin } from "lucide-react";
import { userService, UserProfile } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { getMediaUrl } from "@/lib/media";
import Surface from "@/components/ui/Surface";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { cn } from "@/lib/cn";

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
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("لطفا یک فایل تصویری انتخاب کن");
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (avatarFile) {
                await userService.uploadAvatar(avatarFile);
            }

            await userService.updateProfile({
                display_name: formData.display_name,
                headline: formData.headline,
                city: formData.city,
            });

            setAvatarFile(null);
            setAvatarPreview(null);

            const userData = await userService.getMe();
            setFormData({
                display_name: userData.profile?.display_name || "",
                headline: userData.profile?.headline || "",
                city: userData.profile?.city || "",
                email: userData.email || "",
                phone: userData.phone || "",
                avatar_url: userData.profile?.avatar_url || "",
            });

            alert("تغییرات با موفقیت ذخیره شد");
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("خطا در ذخیره تغییرات");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center" dir="rtl">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="min-h-full px-4 py-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-4xl flex-col gap-5">
                <Surface className="overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                        <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                            <ArrowRight className="h-5 w-5" />
                        </button>
                        <div className="text-center">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">Account</p>
                            <h1 className="mt-1 text-base font-bold text-slate-900">حساب کاربری</h1>
                        </div>
                        <button onClick={handleLogout} className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100" title="خروج">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[220px_1fr] md:items-start">
                        <div className="flex flex-col items-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            <button type="button" onClick={handleAvatarClick} className="group relative">
                                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-white bg-gradient-to-br from-rose-100 to-orange-50 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                                    {avatarPreview ? (
                                        <Image src={avatarPreview} alt="Preview" width={128} height={128} className="h-full w-full object-cover" />
                                    ) : formData.avatar_url ? (
                                        <Image
                                            src={getMediaUrl(formData.avatar_url)}
                                            alt="Profile"
                                            width={128}
                                            height={128}
                                            className="h-full w-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <UserIcon className="h-12 w-12 text-slate-400" />
                                    )}
                                </div>
                                <div className="absolute inset-0 rounded-full border border-transparent transition-colors group-hover:border-rose-200" />
                            </button>

                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                            >
                                <Pencil className="h-4 w-4" />
                                ویرایش تصویر
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">نام و نام خانوادگی</span>
                                    <div className="relative">
                                        <UserIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="display_name"
                                            value={formData.display_name}
                                            onChange={handleInputChange}
                                            placeholder="نام خود را وارد کن"
                                            className={cn(
                                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                                "focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
                                            )}
                                        />
                                    </div>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-semibold text-slate-700">عنوان شغلی</span>
                                    <div className="relative">
                                        <Pencil className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="headline"
                                            value={formData.headline}
                                            onChange={handleInputChange}
                                            placeholder="عنوان شغلی"
                                            className={cn(
                                                "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                                "focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
                                            )}
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        <MapPin className="h-4 w-4" />
                                        موقعیت
                                    </div>
                                    <label className="mt-3 block space-y-2">
                                        <span className="text-sm font-semibold text-slate-700">شهر / کشور</span>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            placeholder="شهر / کشور"
                                            className={cn(
                                                "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
                                                "focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
                                            )}
                                        />
                                    </label>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        <Mail className="h-4 w-4" />
                                        اطلاعات
                                    </div>
                                    <label className="block space-y-2">
                                        <span className="text-sm font-semibold text-slate-700">شماره موبایل</span>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            readOnly
                                            dir="ltr"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 outline-none"
                                        />
                                    </label>
                                    <label className="block space-y-2">
                                        <span className="text-sm font-semibold text-slate-700">ایمیل</span>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            readOnly
                                            dir="ltr"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 outline-none"
                                        />
                                    </label>
                                </div>
                            </div>

                            <PrimaryButton type="submit" className="w-full" leadingIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                            </PrimaryButton>
                        </form>
                    </div>
                </Surface>
            </main>
        </div>
    );
}
