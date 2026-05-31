"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, LogOut, Pencil } from "lucide-react";
import { userService, UserProfile } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { getMediaUrl } from "@/lib/media";
import { BackButton } from "@/components/ui/IconButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ImageAdjustModal from "@/components/ui/ImageAdjustModal";
import { cn } from "@/lib/cn";
import { isKnownProfileHeadline, PROFILE_HEADLINE_OPTIONS } from "@/profileOptions";
import { validateImageFile, validateTextLength, validationMessage } from "@/validation";

interface AccountFormState extends UserProfile {
    email: string;
    phone: string;
}

const accountIcon = "/assets/chinverse/icons/profile.svg";

export default function AccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
                    headline: isKnownProfileHeadline(userData.profile?.headline) ? userData.profile?.headline || "" : "",
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

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((current) => ({ ...current, [name]: "" }));
        setFormMessage(null);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const imageValidation = validateImageFile(file, { maxMb: 5 });
        if (!imageValidation.ok) {
            setFormMessage({ type: "error", text: imageValidation.message });
            return;
        }

        setFormMessage(null);
        setPendingAvatarFile(file);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const nextErrors = {
            display_name: validationMessage(validateTextLength(formData.display_name || "", "نام و نام خانوادگی", { required: true, min: 2, max: 120 })),
            headline: validationMessage(validateTextLength(formData.headline || "", "عنوان شغلی", { required: true })),
            city: validationMessage(validateTextLength(formData.city || "", "شهر / کشور", { max: 80 })),
        };
        setFieldErrors(nextErrors);
        setFormMessage(null);
        if (Object.values(nextErrors).some(Boolean)) return;

        setSaving(true);

        try {
            if (avatarFile) {
                await userService.uploadAvatar(avatarFile);
            }

            await userService.updateProfile({
                display_name: (formData.display_name || "").trim(),
                headline: (formData.headline || "").trim(),
                city: formData.city?.trim(),
            });

            setAvatarFile(null);
            setAvatarPreview(null);

            const userData = await userService.getMe();
            setFormData({
                display_name: userData.profile?.display_name || "",
                headline: isKnownProfileHeadline(userData.profile?.headline) ? userData.profile?.headline || "" : "",
                city: userData.profile?.city || "",
                email: userData.email || "",
                phone: userData.phone || "",
                avatar_url: userData.profile?.avatar_url || "",
            });

            setFormMessage({ type: "success", text: "تغییرات با موفقیت ذخیره شد." });
        } catch (error) {
            console.error("Failed to update profile", error);
            setFormMessage({ type: "error", text: "خطا در ذخیره تغییرات. لطفا فیلدها را بررسی کن و دوباره تلاش کن." });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        router.replace("/login");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center" dir="rtl">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-5">
                <header className="relative flex h-11 items-center justify-center">
                    <BackButton onClick={() => router.back()} className="absolute right-0 top-0" />
                    <h1 className="text-[17px] font-black text-[#2f3238]">حساب کاربری</h1>
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center">
                        <Image src={accountIcon} alt="" width={30} height={30} className="h-8 w-8 object-contain" />
                    </div>
                </header>

                <div className="flex flex-col items-center pt-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    <button type="button" onClick={handleAvatarClick} className="group relative">
                        <div className="flex h-[128px] w-[128px] items-center justify-center overflow-hidden rounded-full bg-white">
                            {avatarPreview ? (
                                <Image src={avatarPreview} alt="پیش‌نمایش تصویر پروفایل" width={128} height={128} className="h-full w-full object-cover" />
                            ) : formData.avatar_url ? (
                                <Image
                                    src={getMediaUrl(formData.avatar_url)}
                                    alt="تصویر پروفایل"
                                    width={128}
                                    height={128}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <Image src={accountIcon} alt="" width={128} height={128} className="h-[128px] w-[128px] object-contain" />
                            )}
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleAvatarClick}
                        className="mt-3 inline-flex items-center gap-2 text-[16px] font-black text-[#2f3238]"
                    >
                        <Pencil className="h-5 w-5" />
                        ویرایش تصویر پروفایل
                    </button>
                </div>

                {formMessage && (
                    <div
                        className={cn(
                            "rounded-2xl px-4 py-3 text-sm font-bold leading-6",
                            formMessage.type === "success"
                                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                                : "border border-rose-100 bg-rose-50 text-rose-700",
                        )}
                    >
                        {formMessage.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <AccountField
                        label="نام و نام خانوادگی"
                        name="display_name"
                        value={formData.display_name || ""}
                        onChange={handleInputChange}
                        error={fieldErrors.display_name}
                    />

                    <FloatingField label="عنوان شغلی" error={fieldErrors.headline}>
                        <select
                            name="headline"
                            value={formData.headline}
                            onChange={handleInputChange}
                            className="h-11 w-full appearance-none rounded-[9px] border-0 bg-transparent px-4 text-center text-[15px] font-medium text-[#2f3238] outline-none"
                        >
                            <option value="">انتخاب شغل</option>
                            {PROFILE_HEADLINE_OPTIONS.map((headline) => (
                                <option key={headline} value={headline}>
                                    {headline}
                                </option>
                            ))}
                        </select>
                    </FloatingField>

                    <AccountField
                        label="لوکیشن"
                        name="city"
                        value={formData.city || ""}
                        onChange={handleInputChange}
                        placeholder="تهران / ایران"
                        error={fieldErrors.city}
                    />

                    <AccountField label="شماره موبایل" name="phone" value={formData.phone || ""} readOnly dir="ltr" />
                    <AccountField label="ایمیل" name="email" value={formData.email || ""} readOnly dir="ltr" />

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                        >
                            <LogOut className="h-4 w-4" />
                            خروج
                        </button>
                        <PrimaryButton type="submit" className="w-full rounded-full" leadingIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
                            {saving ? "در حال ذخیره..." : "ذخیره"}
                        </PrimaryButton>
                    </div>
                </form>
            </main>

            <ImageAdjustModal
                file={pendingAvatarFile}
                isOpen={!!pendingAvatarFile}
                title="تنظیم عکس پروفایل"
                aspectRatio={1}
                frameClassName="rounded-full"
                onCancel={() => setPendingAvatarFile(null)}
                onConfirm={(file, previewUrl) => {
                    setAvatarFile(file);
                    setAvatarPreview(previewUrl);
                    setPendingAvatarFile(null);
                }}
            />
        </div>
    );
}

function AccountField({
    label,
    error,
    ...inputProps
}: {
    label: string;
    error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <FloatingField label={label} error={error}>
            <input
                {...inputProps}
                className={cn(
                    "h-11 w-full rounded-[9px] border-0 bg-transparent px-4 text-center text-[15px] font-medium text-[#2f3238] outline-none placeholder:text-slate-400",
                    inputProps.readOnly && "text-slate-500",
                )}
            />
        </FloatingField>
    );
}

function FloatingField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="block">
            <div className="relative rounded-[9px] bg-[linear-gradient(90deg,#f07d57,#155aa6)] p-[1.5px]">
                <span className="absolute right-1/2 top-0 z-10 -translate-y-1/2 translate-x-1/2 bg-[#f7f8fb] px-3 text-[14px] font-black text-[#2f3238]">
                    {label}
                </span>
                <div className="rounded-[8px] bg-[#f7f8fb]">
                    {children}
                </div>
            </div>
            <FieldError message={error} />
        </label>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs font-bold leading-5 text-rose-600">{message}</p>;
}
