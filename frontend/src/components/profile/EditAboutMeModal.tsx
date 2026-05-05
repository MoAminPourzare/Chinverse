'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Plus, Trash2, Instagram, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { User, userService } from '@/services/user.service';

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

const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
    { id: 'twitter', name: 'Twitter (X)', icon: Twitter },
    { id: 'telegram', name: 'Telegram', icon: MessageCircle },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle },
    { id: 'wechat', name: 'WeChat', icon: MessageCircle },
];

export default function EditAboutMeModal({ isOpen, onClose, user, onUpdate }: EditAboutMeModalProps) {
    const { register, control, handleSubmit, reset } = useForm<FormValues>({
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
        if (user?.profile) {
            reset({
                bio: user.profile.bio || '',
                websites: user.profile.websites?.map((url: string) => ({ url })) || [],
                socials: user.profile.socials || [],
            });
        }
    }, [user, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            const websites = data.websites.map((w) => w.url).filter((url) => url.trim() !== '');
            const socials = data.socials.filter((s) => s.handle.trim() !== '');

            await userService.updateProfile({
                bio: data.bio,
                websites: websites,
                socials: socials,
            });
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Failed to update profile', error);
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
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-right align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 mb-4 text-center">
                                    نوشتن درباره من
                                </Dialog.Title>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    {/* Bio Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            در این بخش می‌تونی به سابقه کاری، مهارت‌ها، تخصص‌ها یا دستاوردهای مهمت اشاره کنی.
                                        </label>
                                        <textarea
                                            {...register('bio')}
                                            rows={6}
                                            className="w-full rounded-xl bg-gray-50 border border-gray-300 p-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="بنویس..."
                                        />
                                    </div>

                                    {/* Websites Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <button
                                                type="button"
                                                onClick={() => appendWebsite({ url: '' })}
                                                className="flex items-center text-blue-600 text-sm font-bold hover:text-blue-700"
                                            >
                                                <Plus className="w-4 h-4 ml-1" />
                                                اضافه کردن وبسایت
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {websiteFields.map((field, index) => (
                                                <div key={field.id} className="flex gap-2">
                                                    <input
                                                        {...register(`websites.${index}.url` as const)}
                                                        className="flex-1 rounded-lg bg-gray-50 border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                        placeholder="https://example.com"
                                                        dir="ltr"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWebsite(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Socials Section */}
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowSocialDropdown(!showSocialDropdown)}
                                                className="flex items-center text-blue-600 text-sm font-bold hover:text-blue-700"
                                            >
                                                <Plus className="w-4 h-4 ml-1" />
                                                اضافه کردن شبکه های اجتماعی
                                            </button>
                                        </div>

                                        {showSocialDropdown && (
                                            <div className="absolute top-8 right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                                                {socialPlatforms.map((platform) => (
                                                    <button
                                                        key={platform.id}
                                                        type="button"
                                                        onClick={() => addSocial(platform.id)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <platform.icon className="w-4 h-4 ml-2" />
                                                        {platform.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {socialFields.map((field, index) => {
                                                const platform = socialPlatforms.find(p => p.id === field.platform);
                                                const Icon = platform?.icon || MessageCircle;
                                                return (
                                                    <div key={field.id} className="flex gap-2 items-center">
                                                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-600">
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <input
                                                            {...register(`socials.${index}.handle` as const)}
                                                            className="flex-1 rounded-lg bg-gray-50 border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                            placeholder={`${platform?.name} ID/Link`}
                                                            dir="ltr"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSocial(index)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="flex gap-3 mt-8 pt-4">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-800 text-white font-bold py-3 rounded-full hover:bg-blue-900 transition-colors"
                                        >
                                            ذخیره کردن
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-300 transition-colors"
                                        >
                                            لغو کردن
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
