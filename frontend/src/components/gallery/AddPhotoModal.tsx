'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ArrowLeft } from 'lucide-react';
import { galleryService } from '@/services/gallery.service';
import Image from 'next/image';

interface AddPhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

export default function AddPhotoModal({ isOpen, onClose, onUploadSuccess }: AddPhotoModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            await galleryService.uploadImage(selectedFile, caption);
            onUploadSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to upload image', error);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreview(null);
        setCaption('');
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/90" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform bg-white transition-all h-screen flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                    <button
                                        onClick={handleClose}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={!selectedFile || uploading}
                                        className="text-blue-600 font-bold disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? 'در حال بارگذاری...' : 'بعدی'}
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                                    {!preview ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <label className="cursor-pointer bg-blue-800 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-900 transition-colors">
                                                انتخاب عکس
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Image Preview */}
                                            <div className="mb-4">
                                                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
                                                    <Image
                                                        src={preview}
                                                        alt="Preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>

                                            {/* Caption Input */}
                                            <div>
                                                <textarea
                                                    value={caption}
                                                    onChange={(e) => setCaption(e.target.value)}
                                                    rows={4}
                                                    className="w-full rounded-xl bg-gray-50 border border-gray-300 p-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    placeholder="هر عکسی یه داستانی داره... داستانتو اینجا بنویس!"
                                                    dir="rtl"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Footer Button (Alternative placement) */}
                                {preview && (
                                    <div className="p-4 border-t border-gray-100">
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="w-full bg-blue-800 text-white font-bold py-3 rounded-full hover:bg-blue-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {uploading ? 'در حال بارگذاری...' : 'اشتراک گذاری'}
                                        </button>
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
