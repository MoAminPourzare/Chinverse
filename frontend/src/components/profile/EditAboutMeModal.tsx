'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { User, userService } from '@/services/user.service';
import {
    getSocialPlatform,
    normalizeSocialHandle,
    socialPlatforms,
    validateSocialHandle,
} from '@/lib/socialLinks';

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
            bio: '',
            websites: [],
            socials: [],
        },
    });

    const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({
        control,
        name: 'websites',
    });

    const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
        control,
        name: 'socials',
    });

    const [showSocialDropdown, setShowSocialDropdown] = useState(false);

    useEffect(() => {
        reset({
            bio: user?.profile?.bio || '',
            websites: user?.profile?.websites?.map((url: string) => ({ url })) || [],
            socials: user?.profile?.socials || [],
        });
    }, [user, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            const websites = data.websites
                .map((website) => website.url.trim())
                .filter(Boolean);
            const socials: SocialLink[] = [];

            data.socials.forEach((social, index) => {
                const handle = normalizeSocialHandle(social.platform, social.handle);
                if (!handle) return;

                if (!validateSocialHandle(social.platform, handle)) {
                    const platform = getSocialPlatform(social.platform);
                    setError(`socials.${index}.handle`, {
                        type: 'manual',
                        message: platform.errorMessage,
                    });
                    throw new Error('Invalid social handle');
                }

                socials.push({
                    platform: social.platform === 'x' ? 'twitter' : social.platform,
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
            if ((error as Error).message !== 'Invalid social handle') {
                console.error('Failed to update profile', error);
            }
        }
    };

    const addSocial = (platform: string) => {
        appendSocial({ platform, handle: '' });
        setShowSocialDropdown(false);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose} dir="rtl">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" />
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
                            <Dialog.Panel className="max-h-[90vh] w-full max-w-md transform overflow-hidden rounded-[30px] bg-white text-right align-middle shadow-xl transition-all">
                                <div className="max-h-[90vh] overflow-y-auto p-6">
                                    <Dialog.Title as="h3" className="mb-1 text-center text-lg font-black leading-6 text-slate-900">
                                        ویرایش درباره من
                                    </Dialog.Title>
                                    <p className="mb-5 text-center text-xs leading-6 text-slate-500">
                                        معرفی کوتاه، وب‌سایت‌ها و شبکه‌های اجتماعی‌ات را مرتب و قابل کلیک ثبت کن.
                                    </p>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">
                                                درباره من
                                            </label>
                                            <textarea
                                                {...register('bio')}
                                                rows={6}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                                                placeholder="کمی درباره خودت، مهارت‌ها، علاقه‌ها یا تجربه‌هایت بنویس..."
                                            />
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => appendWebsite({ url: '' })}
                                                    className="flex items-center gap-1 text-sm font-bold text-rose-600 hover:text-rose-700"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    اضافه کردن وب‌سایت
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {websiteFields.map((field, index) => (
                                                    <div key={field.id} className="flex gap-2">
                                                        <input
                                                            {...register(`websites.${index}.url` as const)}
                                                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                                                            placeholder="https://example.com"
                                                            dir="ltr"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeWebsite(index)}
                                                            className="rounded-xl p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSocialDropdown((value) => !value)}
                                                    className="flex items-center gap-1 text-sm font-bold text-rose-600 hover:text-rose-700"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    اضافه کردن شبکه اجتماعی
                                                    <ChevronDown className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {showSocialDropdown && (
                                                <div className="mb-3 grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                                                    {socialPlatforms.map((platform) => (
                                                        <button
                                                            key={platform.id}
                                                            type="button"
                                                            onClick={() => addSocial(platform.id)}
                                                            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                                                        >
                                                            <platform.icon className="h-4 w-4" />
                                                            {platform.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                {socialFields.map((field, index) => {
                                                    const platform = getSocialPlatform(field.platform);
                                                    const Icon = platform.icon;
                                                    const fieldError = errors.socials?.[index]?.handle?.message;

                                                    return (
                                                        <div key={field.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
                                                                    <Icon className="h-4 w-4" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-black text-slate-800">{platform.name}</p>
                                                                    <p className="text-[11px] leading-5 text-slate-400">{platform.hint}</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSocial(index)}
                                                                    className="rounded-xl p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
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
                                                                            type: 'manual',
                                                                            message: platform.errorMessage,
                                                                        });
                                                                    },
                                                                })}
                                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
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

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="submit"
                                                className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 font-bold text-white transition hover:from-rose-600 hover:to-orange-600"
                                            >
                                                ذخیره کردن
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="flex-1 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
                                            >
                                                لغو
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
