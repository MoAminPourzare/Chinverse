"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, ImageIcon, Loader2, MessageCircle, Plus, Trash2, Upload, X } from "lucide-react";
import ImageAdjustModal from "@/components/ui/ImageAdjustModal";
import LikeButton from "@/components/engagement/LikeButton";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps, getTextAlign } from "@/lib/textDirection";
import { userService, UserService } from "@/services/user.service";
import { validateImageFile, validateTextLength, validationMessage } from "@/validation";

interface ServicesTabProps {
    userId?: number;
    readOnly?: boolean;
}

export default function ServicesTab({ userId, readOnly = false }: ServicesTabProps) {
    const [services, setServices] = useState<UserService[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState("");
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
            setFetchError("");
            const data = userId ? await userService.getUserServices(userId) : await userService.getMyServices();
            setServices(data);
        } catch (fetchError) {
            setServices([]);
            setFetchError(getServiceErrorMessage(fetchError, Boolean(userId)));
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

    const handleBannerChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        const fileValidation = validateImageFile(file, { maxMb: 5 });
        if (!fileValidation.ok) {
            setError(fileValidation.message);
            return;
        }

        setError("");
        setPendingBannerFile(file);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const cleanTitle = title.trim();
        const cleanDescription = description.trim();
        const validationError =
            validationMessage(validateTextLength(cleanTitle, "عنوان خدمت", { required: true, max: 160 })) ||
            validationMessage(validateTextLength(cleanDescription, "توضیحات خدمت", { required: true, max: 4000 })) ||
            validationMessage(validateImageFile(bannerFile, { maxMb: 5 }));

        if (validationError) {
            setError(validationError);
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
            setError(getServiceErrorMessage(submitError, false, "ثبت خدمت انجام نشد. لطفا دوباره امتحان کن."));
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
            setFetchError(getServiceErrorMessage(deleteError, false, "حذف خدمت انجام نشد. لطفا دوباره تلاش کن."));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="p-4">
                <div className="rounded-[24px] border border-rose-100 bg-rose-50 px-4 py-5 text-center">
                    <p className="text-sm font-black text-rose-700">{fetchError}</p>
                    <button
                        type="button"
                        onClick={() => void fetchServices()}
                        className="mt-4 rounded-2xl bg-[#155aa6] px-4 py-2 text-sm font-black text-white shadow-[0_10px_20px_rgba(21,90,166,0.20)] transition hover:bg-[#0f4e92]"
                    >
                        تلاش دوباره
                    </button>
                </div>
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <>
                <div className="flex min-h-[360px] flex-col items-center justify-start px-8 pb-8 pt-8 text-center">
                    <div className="relative mb-6 h-[100px] w-[100px]">
                        <Image
                            src="/assets/chinverse/icons/services.svg"
                            alt=""
                            fill
                            sizes="100px"
                            className="object-contain"
                        />
                    </div>
                    <h3 className="text-[18px] font-black leading-8 text-[#25272d]">
                        اولین خدمتت رو ثبت کن!
                    </h3>
                    <p className="mt-3 max-w-[300px] text-[12px] font-medium leading-7 text-[#888e99]">
                        اینجا میتونی دوره‌های آموزشی، ترجمه رسمی، مشاوره بازرگانی یا هر خدمت مرتبط با زبان چینی و معرفی کسب‌وکارت رو ثبت کنی.
                    </p>
                    {isOwner ? (
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="mt-7 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#155aa6] text-white shadow-[0_12px_24px_rgba(21,90,166,0.34)] transition hover:-translate-y-0.5 hover:bg-[#0f4e92]"
                            aria-label="افزودن خدمت"
                        >
                            <Plus className="h-6 w-6" />
                        </button>
                    ) : null}
                </div>
                <ServiceModal
                    isOpen={isModalOpen}
                    title={title}
                    description={description}
                    bannerPreview={bannerPreview}
                    error={error}
                    submitting={submitting}
                    pendingBannerFile={pendingBannerFile}
                    fileInputRef={fileInputRef}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                    onTitleChange={setTitle}
                    onDescriptionChange={setDescription}
                    onBannerChange={handleBannerChange}
                    onCancelAdjust={() => setPendingBannerFile(null)}
                    onConfirmAdjust={(file, previewUrl) => {
                        setBannerFile(file);
                        setBannerPreview(previewUrl);
                        setPendingBannerFile(null);
                    }}
                />
            </>
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
                        className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#155aa6] text-white shadow-[0_12px_24px_rgba(21,90,166,0.34)] transition hover:-translate-y-0.5 hover:bg-[#0f4e92]"
                        aria-label="افزودن خدمت"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                )}
            </div>

            <ServiceModal
                isOpen={isModalOpen}
                title={title}
                description={description}
                bannerPreview={bannerPreview}
                error={error}
                submitting={submitting}
                pendingBannerFile={pendingBannerFile}
                fileInputRef={fileInputRef}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onBannerChange={handleBannerChange}
                onCancelAdjust={() => setPendingBannerFile(null)}
                onConfirmAdjust={(file, previewUrl) => {
                    setBannerFile(file);
                    setBannerPreview(previewUrl);
                    setPendingBannerFile(null);
                }}
            />
        </div>
    );
}

function getServiceErrorMessage(error: unknown, isPublicView: boolean, fallback = "دریافت خدمات انجام نشد. لطفا دوباره تلاش کن.") {
    const axiosError = error as {
        message?: string;
        code?: string;
        response?: { status?: number; data?: { detail?: string } };
    };

    if (!axiosError.response) {
        return "ارتباط با سرور برقرار نشد. مطمئن شو بک‌اند روشن است و دوباره تلاش کن.";
    }
    if (axiosError.response.status === 401) {
        return isPublicView ? "برای دیدن این بخش باید وارد حساب شوی." : "نشست کاربری منقضی شده؛ لطفا دوباره وارد شو.";
    }
    if (axiosError.response.status === 403) {
        return "اجازه دسترسی به این بخش را نداری.";
    }

    return axiosError.response.data?.detail || fallback;
}

interface ServiceModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    bannerPreview: string | null;
    error: string;
    submitting: boolean;
    pendingBannerFile: File | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onClose: () => void;
    onSubmit: (event: FormEvent) => void;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onBannerChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onCancelAdjust: () => void;
    onConfirmAdjust: (file: File, previewUrl: string) => void;
}

function ServiceModal({
    isOpen,
    title,
    description,
    bannerPreview,
    error,
    submitting,
    pendingBannerFile,
    fileInputRef,
    onClose,
    onSubmit,
    onTitleChange,
    onDescriptionChange,
    onBannerChange,
    onCancelAdjust,
    onConfirmAdjust,
}: ServiceModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-[120]"
                onClose={() => {
                    if (pendingBannerFile) return;
                    onClose();
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
                                    <div className="min-w-0 flex-1 text-center">
                                        <Dialog.Title as="h2" className="text-base font-black text-slate-900">
                                            افزودن خدمت جدید
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="order-first flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d5e1ef] bg-white/90 text-slate-600 shadow-sm transition hover:bg-[#eef6ff] hover:text-[#155aa6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155aa6]/30"
                                        aria-label="بستن"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto p-5">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">عنوان خدمت *</label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(event) => onTitleChange(event.target.value)}
                                                placeholder="مثلا: راهنمای تور و سفر چین"
                                                dir="auto"
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">تصویر خدمت</label>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="relative h-44 w-full overflow-hidden rounded-[24px] border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-[#155aa6] hover:bg-[#eef6ff]"
                                            >
                                                {bannerPreview ? (
                                                    <Image src={bannerPreview} alt="پیش‌نمایش خدمت" fill className="object-cover" />
                                                ) : (
                                                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                        <Upload className="h-8 w-8" />
                                                        <span className="text-sm font-bold">انتخاب تصویر</span>
                                                        <span className="text-xs">JPG، PNG یا WEBP تا ۵MB</span>
                                                    </span>
                                                )}
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={onBannerChange}
                                                className="hidden"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-slate-700">توضیحات خدمت *</label>
                                            <textarea
                                                value={description}
                                                onChange={(event) => onDescriptionChange(event.target.value)}
                                                placeholder="توضیح بده این خدمت چیست، برای چه کسانی مناسب است و کاربر با درخواست مشاوره چه چیزی دریافت می‌کند."
                                                dir="auto"
                                                rows={8}
                                                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10"
                                            />
                                        </div>

                                        {error && (
                                            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                                                {error}
                                            </p>
                                        )}
                                    </div>

                                    <div className="sticky bottom-0 mt-5 border-t border-slate-100 bg-white pt-3">
                                        <button
                                            type="submit"
                                            disabled={submitting || !title.trim() || !description.trim()}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(21,90,166,0.22)] transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <BriefcaseBusiness className="h-5 w-5" />}
                                            {submitting ? "در حال ثبت..." : "ثبت خدمت"}
                                        </button>
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
                    onCancel={onCancelAdjust}
                    onConfirm={onConfirmAdjust}
                />
            </Dialog>
        </Transition>
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
    const titleProps = getDirectionalTextProps(service.title);
    const descriptionProps = getDirectionalTextProps(service.description);

    return (
        <article className="overflow-hidden rounded-[16px] border border-[#cfd3da] bg-[#e1e4ea] p-2 text-right shadow-[0_6px_14px_rgba(15,23,42,0.13)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.16)]">
            <Link href={`/services/${service.id}`} className="block">
                <div className="relative h-40 overflow-hidden rounded-[12px] bg-gradient-to-br from-slate-200 to-[#eef6ff] shadow-sm">
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
                        <div className="flex h-full items-center justify-center bg-[#d5dbe5] text-[#155aa6]/50">
                            <ImageIcon size={42} />
                        </div>
                    )}
                </div>
            </Link>

            <div className="px-2 pb-2 pt-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                    <Link href={`/services/${service.id}`} className="min-w-0 flex-1">
                        <h3 className={cn("line-clamp-2 text-base font-black leading-7 text-[#25272d]", getTextAlign(service.title))} {...titleProps}>{service.title}</h3>
                    </Link>
                    {isOwner && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="rounded-2xl bg-white/70 p-2 text-red-500 shadow-sm transition hover:bg-red-50 hover:text-red-700"
                            aria-label="حذف خدمت"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <p className={cn("line-clamp-3 text-sm leading-7 text-[#555c68]", getTextAlign(service.description))} {...descriptionProps}>{service.description}</p>

                <div className="mt-4">
                    <LikeButton targetType="service" targetId={service.id} initialCount={service.likes_count || 0} compact />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href={`/services/${service.id}`} className="flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/85 px-3 py-2 text-sm font-bold text-[#155aa6] shadow-sm transition hover:bg-white">
                        <ArrowLeft className="h-4 w-4" />
                        جزئیات
                    </Link>
                    {!isOwner && chatUserId && (
                        <Link href={`/chat/${chatUserId}`} className="flex items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-3 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(21,90,166,0.22)] transition hover:bg-[#0f4e92]">
                            <MessageCircle className="h-4 w-4" />
                            مشاوره
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}
