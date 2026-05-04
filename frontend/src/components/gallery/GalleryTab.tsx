'use client';

import { useState, useEffect } from 'react';
import { Plus, ImageIcon } from 'lucide-react';
import { galleryService, GalleryItem } from '@/services/gallery.service';
import Image from 'next/image';
import AddPhotoModal from '@/components/gallery/AddPhotoModal';
import ImageDetailModal from '@/components/gallery/ImageDetailModal';
import { getMediaUrl } from '@/lib/media';

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
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    // Empty State
    if (galleryItems.length === 0) {
        return (
            <>
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[400px]">
                    <div className="mb-6 relative">
                        <ImageIcon className="w-24 h-24 text-blue-200" strokeWidth={1} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        اولین عکست رو بارگذاری کن!
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
                        با اضافه کردن تصاویر شخصیت، ویترینات یا پروژه‌هات، پروفایلت رو جذاب‌تر و باورپذیرتر کن!
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-800 text-white rounded-full p-4 shadow-lg hover:bg-blue-900 transition-colors"
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
            <div className="p-4 relative">
                {/* Gallery Grid */}
                <div className="grid grid-cols-3 gap-1 mb-20">
                    {galleryItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
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
                    className="fixed bottom-20 right-1/2 transform translate-x-1/2 bg-blue-800 text-white rounded-full p-4 shadow-lg hover:bg-blue-900 transition-colors z-10"
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
