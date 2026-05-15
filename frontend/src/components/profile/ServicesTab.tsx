'use client';

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, ImageIcon, Loader2, MessageCircle, Plus, Trash2, Upload, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ImageAdjustModal from "@/components/ui/ImageAdjustModal";
import LikeButton from "@/components/engagement/LikeButton";
import { getMediaUrl } from "@/lib/media";
import { userService, UserService } from "@/services/user.service";

interface ServicesTabProps {
    userId?: number;
    readOnly?: boolean;
}

export default function ServicesTab({ userId, readOnly = false }: ServicesTabProps) {
    const [services, setServices] = useState<UserService[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isOwner = !userId && !readOnly;

    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            const data = userId ? await userService.getUserServices(userId) : await userService.getMyServices();
            setServices(data);
        } catch (fetchError) {
            console.error("Failed to fetch services", fetchError);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setBannerFile(null);
        setBannerPreview(null);
        setPendingBannerFile(null);
        setError("");
    };

    const closeModal = () => {
        if (submitting) return;
        setIsModalOpen(false);
        resetForm();
    };

    const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("لطفاً یک فایل تصویری معتبر انتخاب کن.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("حجم تصویر نباید بیشتر از 5 مگابایت باشد.");
            return;
        }

        setError("");
        setPendingBannerFile(file);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const cleanTitle = title.trim();
        const cleanDescription = description.trim();

        if (!cleanTitle || !cleanDescription) {
            setError("عنوان و توضیحات خدمت الزامی هستند.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("title", cleanTitle);
            formData.append("description", cleanDescription);
            if (bannerFile) formData.append("banner", bannerFile);

            await userService.createService(formData);
            setIsModalOpen(false);
            resetForm();
            await fetchServices();
        } catch (submitError) {
            console.error("Failed to create service", submitError);
            setError("ثبت خدمت انجام نشد. لطفاً دوباره امتحان کن.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (serviceId: number) => {
        if (!confirm("آیا از حذف این خدمت مطمئن هستی؟")) return;

        try {
            await userService.deleteService(serviceId);
            setServices((current) => current.filter((service) => service.id !== serviceId));
        } catch (deleteError) {
            console.error("Failed to delete service", deleteError);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="space-y-4">
                {services.map((service) => (
                    <ServiceCard
                        key={service.id}
                        service={service}
                        userId={userId}
                        isOwner={isOwner}
                        onDelete={() => handleDelete(service.id)}
                    />
                ))}

                {isOwner && (
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="group flex w-full flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center transition hover:border-rose-300 hover:bg-rose-50"
                    >
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm transition group-hover:scale-105">
                            <Plus className="h-6 w-6" />
                        </span>
                        <span className="font-black text-slate-700">افزودن خدمت جدید</span>
                        <span className="text-xs leading-6 text-slate-400">خدمتت بعد از ثبت در ویترین خدمات نمایش داده می‌شود.</span>
                    </button>
                )}

                {services.length === 0 && !isOwner && (
                    <div className="py-12 text-center text-sm text-slate-400">
                        هنوز خدمتی ثبت نشده است.
                    </div>
                )}
            </div>

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-[120]"
                    onClose={() => {
                        if (pendingBannerFile) return;
                        closeModal();
                    }}
                    dir="rtl"
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm" />
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
                                <Dialog.Panel className="flex h-[min(720px,88vh)] w-full max-w-md flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white text-right align-middle shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition-all">
                                    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
                                        <div>
                                            <Dialog.Title as="h2" className="text-base font-black text-slate-900">
                                                افزودن خدمت جدید
                                            </Dialog.Title>
                                            <p className="mt-1 text-xs text-slate-400">عنوان، تصویر و توضیحات خدمت را وارد کن.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto p-5">
                                        <div className="space-y-5">
                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">عنوان خدمت *</label>
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(event) => setTitle(event.target.value)}
                                                    placeholder="مثلاً: راهنمای تور و سفر چین"
                                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">تصویر خدمت</label>
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="relative h-44 w-full overflow-hidden rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50/50"
                                                >
                                                    {bannerPreview ? (
                                                        <Image src={bannerPreview} alt="پیش نمایش خدمت" fill className="object-cover" />
                                                    ) : (
                                                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                            <Upload className="h-8 w-8" />
                                                            <span className="text-sm font-bold">انتخاب تصویر</span>
                                                            <span className="text-xs">JPG, PNG یا WEBP تا 5MB</span>
                                                        </span>
                                                    )}
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleBannerChange}
                                                    className="hidden"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">توضیحات خدمت *</label>
                                                <textarea
                                                    value={description}
                                                    onChange={(event) => setDescription(event.target.value)}
                                                    placeholder="توضیح بده این خدمت چیست، برای چه کسانی مناسب است و کاربر با درخواست مشاوره چه چیزی دریافت می‌کند."
                                                    rows={8}
                                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                                                />
                                            </div>

                                            {error && (
                                                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                                                    {error}
                                                </p>
                                            )}
                                        </div>

                                        <div className="sticky bottom-0 mt-5 border-t border-slate-100 bg-white pt-3">
                                            <PrimaryButton
                                                type="submit"
                                                disabled={submitting || !title.trim() || !description.trim()}
                                                className="w-full"
                                                leadingIcon={submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <BriefcaseBusiness className="h-5 w-5" />}
                                            >
                                                {submitting ? "در حال ثبت..." : "ثبت خدمت"}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                    <ImageAdjustModal
                        file={pendingBannerFile}
                        isOpen={!!pendingBannerFile}
                        title="تنظیم تصویر خدمت"
                        aspectRatio={16 / 9}
                        onCancel={() => setPendingBannerFile(null)}
                        onConfirm={(file, previewUrl) => {
                            setBannerFile(file);
                            setBannerPreview(previewUrl);
                            setPendingBannerFile(null);
                        }}
                    />
                </Dialog>
            </Transition>

        </div>
    );
}

interface ServiceCardProps {
    service: UserService;
    userId?: number;
    isOwner: boolean;
    onDelete: () => void;
}

function ServiceCard({ service, userId, isOwner, onDelete }: ServiceCardProps) {
    const chatUserId = userId || service.user_id;

    return (
        <article className="overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
            <Link href={`/services/${service.id}`} className="block">
                <div className="relative h-40 bg-gradient-to-br from-slate-100 to-rose-50">
                    {service.banner_url ? (
                        <Image
                            src={getMediaUrl(service.banner_url)}
                            alt={service.title}
                            fill
                            className="object-cover"
                            sizes="430px"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-rose-300">
                            <ImageIcon size={42} />
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                    <Link href={`/services/${service.id}`} className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-base font-black leading-7 text-slate-900">{service.title}</h3>
                    </Link>
                    {isOwner && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="rounded-2xl p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                            aria-label="حذف خدمت"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <p className="line-clamp-3 text-sm leading-7 text-slate-500">{service.description}</p>

                <div className="mt-4">
                    <LikeButton targetType="service" targetId={service.id} initialCount={service.likes_count || 0} compact />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <PrimaryButton href={`/services/${service.id}`} variant="ghost" className="w-full" leadingIcon={<ArrowLeft className="h-4 w-4" />}>
                        جزئیات
                    </PrimaryButton>
                    {!isOwner && chatUserId && (
                        <PrimaryButton href={`/chat/${chatUserId}`} className="w-full" leadingIcon={<MessageCircle className="h-4 w-4" />}>
                            مشاوره
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </article>
    );
}
