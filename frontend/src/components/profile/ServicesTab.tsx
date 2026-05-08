'use client';

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, X, Trash2, Upload, Loader2 } from "lucide-react";
import { userService, UserService } from "@/services/user.service";
import { getMediaUrl } from "@/lib/media";

interface ServicesTabProps {
    userId?: number;  // If provided, show public view. If not, show owner view
    readOnly?: boolean;
}

export default function ServicesTab({ userId, readOnly = false }: ServicesTabProps) {
    const [services, setServices] = useState<UserService[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priceLabel, setPriceLabel] = useState("");
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const isOwner = !userId && !readOnly;

    const fetchServices = useCallback(async () => {
        try {
            let data: UserService[];
            if (userId) {
                data = await userService.getUserServices(userId);
            } else {
                data = await userService.getMyServices();
            }
            setServices(data);
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            if (priceLabel) formData.append("price_label", priceLabel);
            if (bannerFile) formData.append("banner", bannerFile);

            await userService.createService(formData);

            // Reset form
            setTitle("");
            setDescription("");
            setPriceLabel("");
            setBannerFile(null);
            setBannerPreview(null);
            setIsModalOpen(false);

            // Refresh services
            fetchServices();
        } catch (error) {
            console.error("Failed to create service", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (serviceId: number) => {
        if (!confirm("آیا از حذف این خدمت اطمینان دارید؟")) return;

        try {
            await userService.deleteService(serviceId);
            setServices(services.filter(s => s.id !== serviceId));
        } catch (error) {
            console.error("Failed to delete service", error);
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
            {/* Services List */}
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

                {/* Add Service Card (Owner only) */}
                {isOwner && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group flex w-full flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-slate-300 p-8 transition hover:border-rose-300 hover:bg-rose-50/40"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 transition-colors group-hover:bg-rose-100">
                            <Plus className="h-6 w-6 text-slate-400 group-hover:text-rose-500" />
                        </div>
                        <span className="font-medium text-slate-500 group-hover:text-rose-600">
                            افزودن خدمت جدید
                        </span>
                    </button>
                )}

                {/* Empty state */}
                {services.length === 0 && !isOwner && (
                    <div className="text-center py-12 text-gray-400">
                        خدماتی ثبت نشده است
                    </div>
                )}
            </div>

            {/* Add Service Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[30px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]" dir="rtl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                            <h2 className="font-bold text-lg">افزودن خدمت</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-2xl p-2 transition hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Banner Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    تصویر بنر
                                </label>
                                <div
                                    className="relative h-40 w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 transition-colors hover:border-rose-300"
                                    onClick={() => document.getElementById('banner-input')?.click()}
                                >
                                    {bannerPreview ? (
                                        <Image
                                            src={bannerPreview}
                                            alt="Banner preview"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <span className="text-sm">آپلود تصویر</span>
                                        </div>
                                    )}
                                    <input
                                        id="banner-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    عنوان خدمت *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="مثال: دوره تربیت مدرس"
                                    required
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    توضیحات *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="توضیحات کامل خدمت..."
                                    required
                                    rows={4}
                                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                                />
                            </div>

                            {/* Price Label */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    قیمت / هزینه
                                </label>
                                <input
                                    type="text"
                                    value={priceLabel}
                                    onChange={(e) => setPriceLabel(e.target.value)}
                                    placeholder="مثال: توافقی یا ۵۰۰,۰۰۰ تومان"
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting || !title || !description}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 font-medium text-white transition hover:from-rose-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        در حال ثبت...
                                    </>
                                ) : (
                                    "ثبت خدمت"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
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
    // Determine the chat target user ID
    const chatUserId = userId || service.user_id;

    return (
        <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
            {/* Banner Image */}
            {service.banner_url && (
                <div className="relative w-full h-40">
                    <Image
                        src={getMediaUrl(service.banner_url)}
                        alt={service.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">
                        {service.title}
                    </h3>
                    {isOwner && (
                        <button
                            onClick={onDelete}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {service.description}
                </p>

                {service.price_label && (
                    <p className="text-sm text-gray-500 mb-4">
                        هزینه: <span className="font-medium text-gray-700">{service.price_label}</span>
                    </p>
                )}

                {/* Action Button */}
                {!isOwner && (
                    <Link
                        href={`/chat/${chatUserId}`}
                    className="block w-full rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 text-center font-medium text-white transition hover:from-rose-600 hover:to-orange-600"
                    >
                        درخواست مشاوره
                    </Link>
                )}
            </div>
        </div>
    );
}
