"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ChevronDown, Loader2, LogOut, Pencil, Trash2 } from "lucide-react";
import { userService, UserProfile } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { getMediaUrl } from "@/lib/media";
import { BackButton } from "@/components/ui/IconButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ImageAdjustModal from "@/components/ui/ImageAdjustModal";
import { cn } from "@/lib/cn";
import {
    COUNTRY_REGION_OPTIONS,
    GENDER_OPTIONS,
    PROFILE_HEADLINE_OPTIONS,
    getProvinceOptions,
    isKnownProfileHeadline,
    isKnownProvinceForCountry,
    requiresProvince,
} from "@/profileOptions";
import {
    cleanApiValidationMessage,
    hasOnlyPersianNameCharacters,
    IMAGE_FILE_ACCEPT,
    isAdjustableImageFile,
    isImageConvertedOnUpload,
    normalizePersianName,
    validateImageFile,
    validatePersianName,
    validateTextLength,
    validationMessage,
} from "@/validation";

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
    const [avatarMarkedForDeletion, setAvatarMarkedForDeletion] = useState(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [openPicker, setOpenPicker] = useState<"headline" | "gender" | "country" | "city" | null>(null);

    const [formData, setFormData] = useState<AccountFormState>({
        display_name: "",
        headline: "",
        gender: "",
        city: "",
        country: "",
        email: "",
        phone: "",
        avatar_url: "",
        profile_truth_confirmed: false,
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await userService.getMe();
                setFormData({
                    display_name: userData.profile?.display_name || "",
                    headline: isKnownProfileHeadline(userData.profile?.headline) ? userData.profile?.headline || "" : "",
                    gender: userData.profile?.gender || "",
                    city: userData.profile?.city || "",
                    country: userData.profile?.country || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                    avatar_url: userData.profile?.avatar_url || "",
                    profile_truth_confirmed: Boolean(userData.profile?.profile_truth_confirmed),
                });
                setAvatarMarkedForDeletion(false);
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
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "country" && (!requiresProvince(value) || !isKnownProvinceForCountry(value, prev.city)) ? { city: "" } : {}),
        }));
        setFieldErrors((current) => ({
            ...current,
            [name]: name === "display_name" && value && !hasOnlyPersianNameCharacters(value)
                ? "نام را فقط با حروف فارسی بنویس؛ زبان صفحه‌کلید را روی فارسی بگذار."
                : "",
        }));
        setFormMessage(null);
    };

    const handleOptionSelect = (name: "headline" | "gender" | "country" | "city", value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === "country" && (!requiresProvince(value) || !isKnownProvinceForCountry(value, prev.city)) ? { city: "" } : {}),
        }));
        setFieldErrors((current) => ({
            ...current,
            [name]: "",
            ...(name === "country" ? { city: "" } : {}),
        }));
        setFormMessage(null);
        setOpenPicker(null);
    };

    const handleTruthConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target;
        setFormData((prev) => ({ ...prev, profile_truth_confirmed: checked }));
        setFieldErrors((current) => ({ ...current, profile_truth_confirmed: "" }));
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
        setAvatarMarkedForDeletion(false);
        if (isAdjustableImageFile(file)) {
            setPendingAvatarFile(file);
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(null);
    };

    const handleDeleteAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setPendingAvatarFile(null);
        setAvatarMarkedForDeletion(Boolean(formData.avatar_url));
        setFormData((prev) => ({ ...prev, avatar_url: "" }));
        setFormMessage(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const shouldValidateProvince = requiresProvince(formData.country);
        const nextErrors = {
            country: validationMessage(validateTextLength(formData.country || "", "کشور/منطقه", { max: 80 })),
            display_name: validationMessage(validatePersianName(formData.display_name || "")),
            headline: validationMessage(validateTextLength(formData.headline || "", "عنوان شغلی", { required: true })),
            gender: validationMessage(validateTextLength(formData.gender || "", "جنسیت", { max: 32 })),
            city: validationMessage(validateTextLength(formData.city || "", "استان", { max: 80 })),
            profile_truth_confirmed: formData.profile_truth_confirmed
                ? ""
                : "برای ذخیره اطلاعات، تایید صحت پروفایل را تیک بزن.",
        };
        if (shouldValidateProvince && !formData.city) {
            nextErrors.city = "استان را انتخاب کن.";
        } else if (shouldValidateProvince && !isKnownProvinceForCountry(formData.country, formData.city)) {
            nextErrors.city = "استان انتخاب‌شده با کشور/منطقه سازگار نیست.";
        }
        setFieldErrors(nextErrors);
        setFormMessage(null);
        if (Object.values(nextErrors).some(Boolean)) return;

        setSaving(true);

        try {
            if (avatarFile) {
                await userService.uploadAvatar(avatarFile);
            } else if (avatarMarkedForDeletion) {
                await userService.deleteAvatar();
            }

            await userService.updateProfile({
                display_name: normalizePersianName(formData.display_name || ""),
                headline: (formData.headline || "").trim(),
                gender: formData.gender?.trim() || "",
                city: shouldValidateProvince ? formData.city?.trim() : "",
                country: formData.country?.trim(),
                profile_truth_confirmed: Boolean(formData.profile_truth_confirmed),
            });

            setAvatarFile(null);
            setAvatarPreview(null);

            const userData = await userService.getMe();
            setFormData({
                display_name: userData.profile?.display_name || "",
                headline: isKnownProfileHeadline(userData.profile?.headline) ? userData.profile?.headline || "" : "",
                gender: userData.profile?.gender || "",
                city: userData.profile?.city || "",
                country: userData.profile?.country || "",
                email: userData.email || "",
                phone: userData.phone || "",
                avatar_url: userData.profile?.avatar_url || "",
                profile_truth_confirmed: Boolean(userData.profile?.profile_truth_confirmed),
            });
            setAvatarMarkedForDeletion(false);

            setFormMessage({ type: "success", text: "تغییرات با موفقیت ذخیره شد." });
        } catch (error: unknown) {
            console.error("Failed to update profile", error);
            const apiError = error as { response?: { data?: { detail?: string | Array<{ loc?: Array<string | number>; msg?: string }> } } };
            const detail = apiError.response?.data?.detail;
            const issue = Array.isArray(detail) ? detail[0] : null;
            if (issue?.loc?.at(-1) === "display_name") {
                setFieldErrors((current) => ({ ...current, display_name: cleanApiValidationMessage(issue.msg || "نام واردشده معتبر نیست.") }));
            } else {
                setFormMessage({
                    type: "error",
                    text: typeof detail === "string" ? detail : "خطا در ذخیره تغییرات. لطفا فیلدها را بررسی کن و دوباره تلاش کن.",
                });
            }
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

    const provinceOptions = getProvinceOptions(formData.country);
    const shouldShowProvince = provinceOptions.length > 0;
    const hasAvatarImage = Boolean(avatarPreview || avatarFile || formData.avatar_url);

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

                <div className="flex flex-col items-center pb-4 pt-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={IMAGE_FILE_ACCEPT}
                        className="hidden"
                    />

                    <div className="relative">
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
                        {hasAvatarImage && (
                            <button
                                type="button"
                                onClick={handleDeleteAvatar}
                                className="absolute bottom-1 left-1 flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-600 shadow-[0_10px_24px_rgba(190,18,60,0.18)] transition hover:bg-rose-50"
                                aria-label="حذف تصویر پروفایل"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {avatarFile && !avatarPreview && (
                        <p className="mt-3 max-w-[260px] break-all rounded-2xl border border-[#d6e1ee] bg-white px-4 py-2 text-center text-xs font-bold leading-6 text-[#6f7785]">
                            {avatarFile.name}
                            {isImageConvertedOnUpload(avatarFile) ? " بعد از ذخیره به JPG تبدیل می‌شود." : " برای ذخیره آماده است."}
                        </p>
                    )}

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
                        onBlur={() => setFieldErrors((current) => ({
                            ...current,
                            display_name: validationMessage(validatePersianName(formData.display_name || "")),
                        }))}
                        autoComplete="name"
                        maxLength={120}
                        aria-invalid={Boolean(fieldErrors.display_name)}
                        error={fieldErrors.display_name}
                    />

                    <FloatingField label="عنوان شغلی" error={fieldErrors.headline}>
                        <OptionPicker
                            value={formData.headline || ""}
                            placeholder="انتخاب شغل"
                            options={PROFILE_HEADLINE_OPTIONS}
                            isOpen={openPicker === "headline"}
                            onToggle={() => setOpenPicker((current) => current === "headline" ? null : "headline")}
                            onSelect={(value) => handleOptionSelect("headline", value)}
                        />
                    </FloatingField>

                    <FloatingField label="جنسیت" error={fieldErrors.gender}>
                        <OptionPicker
                            value={formData.gender || ""}
                            placeholder="انتخاب جنسیت"
                            options={GENDER_OPTIONS}
                            isOpen={openPicker === "gender"}
                            clearLabel="بدون جنسیت"
                            onToggle={() => setOpenPicker((current) => current === "gender" ? null : "gender")}
                            onSelect={(value) => handleOptionSelect("gender", value)}
                        />
                    </FloatingField>

                    <FloatingField label="کشور/منطقه" error={fieldErrors.country}>
                        <OptionPicker
                            value={formData.country || ""}
                            placeholder="انتخاب کشور/منطقه"
                            options={COUNTRY_REGION_OPTIONS}
                            isOpen={openPicker === "country"}
                            clearLabel="بدون کشور/منطقه"
                            onToggle={() => setOpenPicker((current) => current === "country" ? null : "country")}
                            onSelect={(value) => handleOptionSelect("country", value)}
                        />
                    </FloatingField>

                    {shouldShowProvince && (
                        <FloatingField label="استان" error={fieldErrors.city}>
                            <OptionPicker
                                value={formData.city || ""}
                                placeholder="انتخاب استان"
                                options={provinceOptions}
                                isOpen={openPicker === "city"}
                                onToggle={() => setOpenPicker((current) => current === "city" ? null : "city")}
                                onSelect={(value) => handleOptionSelect("city", value)}
                            />
                        </FloatingField>
                    )}

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

                    <div>
                        <label className="flex items-start gap-3 rounded-[16px] border border-[#d6e1ee] bg-white/70 px-4 py-3 text-right">
                            <input
                                type="checkbox"
                                checked={Boolean(formData.profile_truth_confirmed)}
                                onChange={handleTruthConfirmChange}
                                className="mt-1 h-5 w-5 shrink-0 accent-[#155aa6]"
                            />
                            <span className="text-[13px] font-bold leading-7 text-[#2f3238]">
                                تایید میکنم اطلاعات پروفایل، عناوین شغلی، مهارت ها و خدماتم درست و واقعی است و مسئولیت آن ها با خودم است.
                            </span>
                        </label>
                        <FieldError message={fieldErrors.profile_truth_confirmed} />
                    </div>

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
                            {saving ? "در حال ذخیره…" : "ذخیره"}
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
                    setAvatarMarkedForDeletion(false);
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
    if (inputProps.name === "city") return null;

    return (
        <FloatingField label={label} error={error}>
            <input
                {...inputProps}
                dir={inputProps.dir || "auto"}
                className={cn(
                    "h-11 w-full rounded-[9px] border-0 bg-transparent px-4 text-center text-[15px] font-medium text-[#2f3238] outline-none placeholder:text-slate-400",
                    inputProps.readOnly && "text-slate-500",
                    error && "text-rose-700",
                )}
            />
        </FloatingField>
    );
}

function OptionPicker({
    value,
    placeholder,
    options,
    isOpen,
    clearLabel,
    onToggle,
    onSelect,
}: {
    value: string;
    placeholder: string;
    options: string[];
    isOpen: boolean;
    clearLabel?: string;
    onToggle: () => void;
    onSelect: (value: string) => void;
}) {
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-[8px] bg-[#f7f8fb] px-4 py-2 text-center text-[15px] font-bold text-[#2f3238] outline-none transition-all duration-300",
                    isOpen && "bg-white text-[#155aa6]",
                )}
            >
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#155aa6] transition-transform duration-300", isOpen && "rotate-180")} />
                <span className={cn("min-w-0 flex-1 truncate", !value && "text-slate-400")}>{value || placeholder}</span>
                <span className="h-4 w-4 shrink-0" aria-hidden />
            </button>

            {isOpen && (
                <div className="tab-content-motion border-t border-[#d5e1ef] bg-white/80 px-2 pb-2 pt-3">
                    <div className="max-h-72 overflow-y-auto pr-1">
                        <div className="motion-list grid grid-cols-2 gap-2">
                            {clearLabel && (
                                <button
                                    type="button"
                                    onClick={() => onSelect("")}
                                    className={cn(
                                        "flex min-h-11 items-center justify-center rounded-[16px] border px-3 py-2 text-center text-[12px] font-black transition-all duration-300",
                                        !value
                                            ? "border-[#155aa6] bg-[#155aa6] text-white shadow-[0_10px_20px_rgba(21,90,166,0.22)]"
                                            : "border-[#dbe5f0] bg-[#f8fbff] text-slate-600 hover:border-[#155aa6]/30 hover:bg-[#eef6ff] hover:text-[#155aa6]",
                                    )}
                                >
                                    {clearLabel}
                                </button>
                            )}

                            {options.map((option) => {
                                const active = value === option;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => onSelect(option)}
                                        className={cn(
                                            "flex min-h-11 items-center justify-center gap-1.5 rounded-[16px] border px-3 py-2 text-center text-[12px] font-black leading-5 transition-all duration-300",
                                            active
                                                ? "border-[#155aa6] bg-[#155aa6] text-white shadow-[0_10px_20px_rgba(21,90,166,0.22)]"
                                                : "border-[#dbe5f0] bg-[#f8fbff] text-slate-600 hover:border-[#155aa6]/30 hover:bg-[#eef6ff] hover:text-[#155aa6]",
                                        )}
                                    >
                                        {active && <Check size={14} />}
                                        <span className="line-clamp-2">{option}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FloatingField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div className="block">
            <div className="relative rounded-[9px] bg-[linear-gradient(90deg,#f07d57,#155aa6)] p-[1.5px]">
                <span className="absolute right-1/2 top-0 z-10 -translate-y-1/2 translate-x-1/2 bg-[#f7f8fb] px-3 text-[14px] font-black text-[#2f3238]">
                    {label}
                </span>
                <div className="rounded-[8px] bg-[#f7f8fb]">
                    {children}
                </div>
            </div>
            <FieldError message={error} />
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs font-bold leading-5 text-rose-600">{message}</p>;
}
