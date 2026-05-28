"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Plus, Trash2, X } from "lucide-react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { User, userService } from "@/services/user.service";
import {
    getSocialPlatform,
    normalizeSocialHandle,
    socialPlatforms,
    validateSocialHandle,
} from "@/lib/socialLinks";
import { validateTextLength, validateUrl } from "@/validation";

interface EditAboutMeModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdate: () => void;
}

interface SocialLink {
    platform: string;
    handle: string;
}

interface FormValues {
    bio: string;
    websites: { url: string }[];
    socials: SocialLink[];
}

export default function EditAboutMeModal({ isOpen, onClose, user, onUpdate }: EditAboutMeModalProps) {
    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            bio: "",
            websites: [],
            socials: [],
        },
    });

    const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({
        control,
        name: "websites",
    });

    const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
        control,
        name: "socials",
    });

    const [showSocialDropdown, setShowSocialDropdown] = useState(false);
    const usedSocialPlatforms = new Set(socialFields.map((field) => field.platform === "x" ? "twitter" : field.platform));
    const availableSocialPlatforms = socialPlatforms.filter((platform) => !usedSocialPlatforms.has(platform.id));

    const resetToUser = useCallback(() => {
        reset({
            bio: user?.profile?.bio || "",
            websites: user?.profile?.websites?.map((url: string) => ({ url })) || [],
            socials: user?.profile?.socials || [],
        });
        clearErrors();
        setShowSocialDropdown(false);
    }, [clearErrors, reset, user]);

    useEffect(() => {
        if (isOpen) {
            resetToUser();
        }
    }, [isOpen, resetToUser]);

    const handleClose = () => {
        resetToUser();
        onClose();
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            clearErrors();
            const bioValidation = validateTextLength(data.bio || "", "درباره من", { max: 4000 });
            if (!bioValidation.ok) {
                setError("bio", { type: "manual", message: bioValidation.message });
                throw new Error("Invalid about me");
            }

            const websites = data.websites
                .map((website, index) => {
                    const url = website.url.trim();
                    if (!url) return "";

                    const validation = validateUrl(url, "آدرس وبسایت");
                    if (!validation.ok) {
                        setError(`websites.${index}.url`, {
                            type: "manual",
                            message: validation.message,
                        });
                        throw new Error("Invalid website URL");
                    }

                    return url;
                })
                .filter(Boolean);
            const socials: SocialLink[] = [];

            data.socials.forEach((social, index) => {
                const handle = normalizeSocialHandle(social.platform, social.handle);
                if (!handle) return;

                if (!validateSocialHandle(social.platform, handle)) {
                    const platform = getSocialPlatform(social.platform);
                    setError(`socials.${index}.handle`, {
                        type: "manual",
                        message: platform.errorMessage,
                    });
                    throw new Error("Invalid social handle");
                }

                socials.push({
                    platform: social.platform === "x" ? "twitter" : social.platform,
                    handle,
                });
            });

            await userService.updateProfile({
                bio: data.bio,
                websites,
                socials,
            });
            onUpdate();
            onClose();
        } catch (error) {
            if (!["Invalid social handle", "Invalid website URL", "Invalid about me"].includes((error as Error).message)) {
                console.error("Failed to update profile", error);
            }
        }
    };

    const addSocial = (platform: string) => {
        if (usedSocialPlatforms.has(platform)) return;
        appendSocial({ platform, handle: "" });
        setShowSocialDropdown(false);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose} dir="rtl">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="flex h-[min(720px,92vh)] w-full max-w-md transform flex-col overflow-hidden rounded-[30px] bg-[#f9fafc] text-right align-middle shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition-all">
                                <div className="flex shrink-0 items-center justify-between px-5 py-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                                        aria-label="بستن"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                    <Dialog.Title as="h3" className="text-[18px] font-black text-[#25272d]">
                                        نوشتن درباره من
                                    </Dialog.Title>
                                    <span className="h-9 w-9" />
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
                                    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
                                        <textarea
                                            {...register("bio")}
                                            rows={9}
                                            className="min-h-[210px] w-full rounded-[10px] border-2 border-[#155aa6] bg-white p-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-[#155aa6]/10"
                                            placeholder="درباره خودت بنویس..."
                                        />
                                        {errors.bio?.message && (
                                            <p className="mt-2 text-xs leading-5 text-red-500">{errors.bio.message}</p>
                                        )}

                                        <div className="mt-5">
                                            <button
                                                type="button"
                                                onClick={() => appendWebsite({ url: "" })}
                                                className="mr-auto flex items-center gap-1 text-[14px] font-black text-[#155aa6]"
                                            >
                                                <Plus className="h-4 w-4" />
                                                اضافه کردن وبسایت
                                            </button>
                                            <div className="mt-3 space-y-2">
                                                {websiteFields.map((field, index) => (
                                                    <div key={field.id}>
                                                        <div className="flex gap-2">
                                                            <input
                                                                {...register(`websites.${index}.url` as const)}
                                                                className="min-w-0 flex-1 rounded-lg border border-transparent bg-[#e2e5eb] px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[#155aa6] focus:bg-white"
                                                                placeholder="https://example.com"
                                                                dir="ltr"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeWebsite(index)}
                                                                className="rounded-lg bg-white p-2 text-red-500 shadow-sm transition hover:bg-red-50"
                                                                aria-label="حذف وبسایت"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                        {errors.websites?.[index]?.url?.message && (
                                                            <p className="mt-1 text-xs leading-5 text-red-500">{errors.websites[index]?.url?.message}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <button
                                                type="button"
                                                onClick={() => setShowSocialDropdown((value) => !value)}
                                                className="mr-auto flex items-center gap-1 text-[14px] font-black text-[#155aa6]"
                                            >
                                                <Plus className="h-4 w-4" />
                                                اضافه کردن شبکه های اجتماعی
                                            </button>

                                            {showSocialDropdown && (
                                                <div className="mt-3 rounded-[24px] border border-[#d6e1ee] bg-white p-3 shadow-[0_18px_38px_rgba(15,23,42,0.10)]">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <p className="text-sm font-black text-slate-800">انتخاب شبکه اجتماعی</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowSocialDropdown(false)}
                                                            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                            aria-label="بستن انتخاب شبکه اجتماعی"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto">
                                                        {availableSocialPlatforms.length > 0 ? availableSocialPlatforms.map((platform) => {
                                                            const Icon = platform.icon;
                                                            return (
                                                                <button
                                                                    key={platform.id}
                                                                    type="button"
                                                                    onClick={() => addSocial(platform.id)}
                                                                    className="flex items-center gap-2 rounded-xl bg-[#f5f8fc] px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#eef6ff] hover:text-[#155aa6]"
                                                                >
                                                                    <Icon className="h-4 w-4" />
                                                                    {platform.name}
                                                                </button>
                                                            );
                                                        }) : (
                                                            <div className="col-span-2 rounded-2xl bg-[#f5f8fc] px-3 py-4 text-center text-xs font-bold text-slate-400">
                                                                همه شبکه‌های موجود اضافه شده‌اند.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-3 space-y-3">
                                                {socialFields.map((field, index) => {
                                                    const platform = getSocialPlatform(field.platform);
                                                    const Icon = platform.icon;
                                                    const fieldError = errors.socials?.[index]?.handle?.message;

                                                    return (
                                                        <div key={field.id} className="rounded-2xl border border-[#d6e1ee] bg-white p-3 shadow-sm">
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef6ff] text-[#155aa6]">
                                                                    <Icon className="h-4 w-4" />
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-black text-slate-800">{platform.name}</p>
                                                                    <p className="text-[11px] leading-5 text-slate-400">{platform.hint}</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSocial(index)}
                                                                    className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
                                                                    aria-label="حذف شبکه اجتماعی"
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </button>
                                                            </div>
                                                            <input
                                                                {...register(`socials.${index}.handle` as const, {
                                                                    onChange: (event) => {
                                                                        const handle = normalizeSocialHandle(field.platform, event.target.value);
                                                                        if (!handle || validateSocialHandle(field.platform, handle)) {
                                                                            clearErrors(`socials.${index}.handle`);
                                                                            return;
                                                                        }

                                                                        setError(`socials.${index}.handle`, {
                                                                            type: "manual",
                                                                            message: platform.errorMessage,
                                                                        });
                                                                    },
                                                                })}
                                                                className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10"
                                                                placeholder={platform.placeholder}
                                                                dir="ltr"
                                                            />
                                                            {fieldError && (
                                                                <p className="mt-2 text-xs leading-5 text-red-500">{fieldError}</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid shrink-0 grid-cols-2 gap-4 px-6 py-5">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="rounded-full bg-[#e7eaf0] py-3 text-sm font-bold text-slate-500 shadow-[0_5px_10px_rgba(15,23,42,0.16)] transition hover:bg-slate-200"
                                        >
                                            لغو کردن
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded-full bg-[#155aa6] py-3 text-sm font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.32)] transition hover:bg-[#0f4e92]"
                                        >
                                            ذخیره کردن
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
