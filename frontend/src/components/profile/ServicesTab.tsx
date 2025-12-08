'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, X, Trash2, Upload, Loader2 } from "lucide-react";
import { userService, UserService } from "@/services/user.service";

interface ServicesTabProps {
    userId?: number;  // If provided, show public view. If not, show owner view
    readOnly?: boolean;
}

// Helper function to construct proper image URLs
const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "";

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    if (path.startsWith("http")) return path;

    // Service banners are at /uploads/services/
    if (path.includes("/uploads/services/")) {
        const filename = path.split("/").pop();
        return `${API_URL}/static/uploads/services/${filename}`;
    }

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_URL}${cleanPath}`;
};

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

    const fetchServices = async () => {
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
    };

    useEffect(() => {
        fetchServices();
    }, [userId]);

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
                        className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                        </div>
                        <span className="text-gray-500 font-medium group-hover:text-blue-600">
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
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                            <h2 className="font-bold text-lg">افزودن خدمت</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
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
                                    className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer"
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting || !title || !description}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="bg-gray-50 rounded-2xl overflow-hidden">
            {/* Banner Image */}
            {service.banner_url && (
                <div className="relative w-full h-40">
                    <Image
                        src={getImageUrl(service.banner_url)}
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
                        className="block w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-center hover:bg-blue-700 transition-colors"
                    >
                        درخواست مشاوره
                    </Link>
                )}
            </div>
        </div>
    );
}
