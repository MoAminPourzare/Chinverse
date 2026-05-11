'use client';

import dynamic from "next/dynamic";
import { useState, useEffect } from 'react';
import { Plus, ImageIcon } from 'lucide-react';
import { galleryService, GalleryItem } from '@/services/gallery.service';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media';

const AddPhotoModal = dynamic(() => import('@/components/gallery/AddPhotoModal'), {
    ssr: false,
});
const ImageDetailModal = dynamic(() => import('@/components/gallery/ImageDetailModal'), {
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
            console.error('Failed to fetch gallery', error);
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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
            </div>
        );
    }

    // Empty State
    if (galleryItems.length === 0) {
        return (
            <>
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[400px]">
                    <div className="mb-6 relative">
                        <ImageIcon className="w-24 h-24 text-rose-200" strokeWidth={1} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        اولین عکست رو بارگذاری کن!
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
                        با اضافه کردن تصاویر شخصیت، ویترینات یا پروژه‌هات، پروفایلت رو جذاب‌تر و باورپذیرتر کن!
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition hover:from-rose-600 hover:to-orange-600"
                    >
                        <Plus className="w-6 h-6" />
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

    // Grid State
    return (
        <>
            <div className="relative p-4">
                {/* Gallery Grid */}
                <div className="mb-20 grid grid-cols-3 gap-2">
                    {galleryItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-slate-100 transition hover:opacity-90"
                        >
                            <Image
                                src={getMediaUrl(item.image_url)}
                                alt={item.caption || 'Gallery image'}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </button>
                    ))}
                </div>

                {/* Floating Add Button */}
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="fixed bottom-20 right-1/2 z-10 translate-x-1/2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition hover:from-rose-600 hover:to-orange-600"
                >
                    <Plus className="w-6 h-6" />
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
