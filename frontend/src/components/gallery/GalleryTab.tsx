"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { galleryService, GalleryItem } from "@/services/gallery.service";
import { getMediaUrl } from "@/lib/media";

const AddPhotoModal = dynamic(() => import("@/components/gallery/AddPhotoModal"), {
    ssr: false,
});
const ImageDetailModal = dynamic(() => import("@/components/gallery/ImageDetailModal"), {
    ssr: false,
});

export default function GalleryTab() {
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    const fetchGallery = async () => {
        try {
            setLoading(true);
            const items = await galleryService.getGallery();
            setGalleryItems(items);
        } catch (error) {
            console.error("Failed to fetch gallery", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    const handleUploadSuccess = () => {
        fetchGallery();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
            </div>
        );
    }

    if (galleryItems.length === 0) {
        return (
            <>
                <div className="flex min-h-[360px] flex-col items-center justify-start px-8 pb-8 pt-8 text-center">
                    <div className="relative mb-6 h-[100px] w-[100px]">
                        <Image
                            src="/assets/chinverse/icons/photo.svg"
                            alt=""
                            fill
                            sizes="100px"
                            className="object-contain"
                        />
                    </div>
                    <h3 className="text-[18px] font-black leading-8 text-[#25272d]">
                        اولین عکست رو بارگذاری کن!
                    </h3>
                    <p className="mt-3 max-w-[300px] text-[12px] font-medium leading-7 text-[#888e99]">
                        با اضافه کردن تصاویر نمونه‌کار یا فعالیت‌هات، پروفایلت توی ویترین بیشتر به چشم میاد.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-5 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#155aa6] text-white shadow-[0_12px_24px_rgba(21,90,166,0.34)] transition hover:-translate-y-0.5 hover:bg-[#0f4e92]"
                        aria-label="افزودن عکس"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                </div>

                <AddPhotoModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onUploadSuccess={handleUploadSuccess}
                />
            </>
        );
    }

    return (
        <>
            <div className="relative p-4">
                <div className="mb-20 grid grid-cols-3 gap-2">
                    {galleryItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-slate-100 transition hover:opacity-90"
                            aria-label="مشاهده عکس"
                        >
                            <Image
                                src={getMediaUrl(item.image_url)}
                                alt={item.caption || "Gallery image"}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="fixed bottom-24 right-1/2 z-10 flex h-[54px] w-[54px] translate-x-1/2 items-center justify-center rounded-full bg-[#155aa6] text-white shadow-[0_12px_24px_rgba(21,90,166,0.34)] transition hover:-translate-y-0.5 hover:bg-[#0f4e92]"
                    aria-label="افزودن عکس"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </div>

            <AddPhotoModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />

            <ImageDetailModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />
        </>
    );
}
