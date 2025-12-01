'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { GalleryItem } from '@/services/gallery.service';

interface ImageDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: GalleryItem | null;
}

// Helper function to construct image URLs
function getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // Prepend /static/ to the path since backend mounts static dir at /static
    // and images are stored in static/uploads/gallery
    return `${baseUrl}/static/${cleanPath}`;
}

export default function ImageDetailModal({ isOpen, onClose, item }: ImageDetailModalProps) {
    if (!item) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/95" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform transition-all">
                                {/* Close Button */}
                                <div className="flex justify-start mb-4">
                                    <button
                                        onClick={onClose}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-white" />
                                    </button>
                                </div>

                                {/* Image Container */}
                                <div className="relative w-full max-h-[70vh] rounded-2xl overflow-hidden bg-gray-900 mb-4">
                                    <img
                                        src={getImageUrl(item.image_url)}
                                        alt={item.caption || 'Gallery image'}
                                        className="w-full h-full max-h-[70vh] object-contain"
                                    />
                                </div>

                                {/* Caption and Date */}
                                {(item.caption || item.created_at) && (
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-white" dir="rtl">
                                        {item.caption && (
                                            <p className="text-base mb-2">{item.caption}</p>
                                        )}
                                        {item.created_at && (
                                            <p className="text-sm text-white/70">
                                                {formatDate(item.created_at)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
