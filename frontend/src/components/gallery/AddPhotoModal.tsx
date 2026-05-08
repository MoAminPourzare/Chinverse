'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowLeft } from 'lucide-react';
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
                    <div className="flex min-h-full items-center justify-center p-3">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="flex h-[min(92vh,760px)] w-full max-w-md transform flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white transition-all shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                                    <button
                                        onClick={handleClose}
                                        className="rounded-2xl p-2 transition hover:bg-slate-100"
                                    >
                                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={!selectedFile || uploading}
                                        className="font-bold text-rose-600 disabled:cursor-not-allowed disabled:text-slate-400"
                                    >
                                        {uploading ? 'در حال بارگذاری...' : 'بعدی'}
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                                    {!preview ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <label className="cursor-pointer rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3 font-bold text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition hover:from-rose-600 hover:to-orange-600">
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
                                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                                                    placeholder="هر عکسی یه داستانی داره... داستانتو اینجا بنویس!"
                                                    dir="rtl"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Footer Button (Alternative placement) */}
                                {preview && (
                                    <div className="border-t border-slate-100 p-4">
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 py-3 font-bold text-white shadow-[0_16px_30px_rgba(244,63,94,0.24)] transition hover:from-rose-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
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
