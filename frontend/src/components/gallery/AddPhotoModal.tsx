"use client";

import { Fragment, useState, type ChangeEvent } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { galleryService } from "@/services/gallery.service";
import ImageAdjustModal from "@/components/ui/ImageAdjustModal";
import { IconButton } from "@/components/ui/IconButton";
import { validateImageFile, validateTextLength, validationMessage } from "@/validation";

interface AddPhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

export default function AddPhotoModal({ isOpen, onClose, onUploadSuccess }: AddPhotoModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        const fileValidation = validateImageFile(file || null, { required: true, maxMb: 5 });
        if (!fileValidation.ok) {
            setError(fileValidation.message);
            return;
        }

        setError("");
        setPendingFile(file || null);
    };

    const handleUpload = async () => {
        const fileValidation = validateImageFile(selectedFile, { required: true, maxMb: 5 });
        const captionValidation = validateTextLength(caption, "متن عکس", { max: 500 });
        const validationError = validationMessage(fileValidation) || validationMessage(captionValidation);
        if (validationError) {
            setError(validationError);
            return;
        }
        if (!selectedFile) return;

        setUploading(true);
        setError("");
        try {
            await galleryService.uploadImage(selectedFile, caption.trim());
            onUploadSuccess();
            handleClose();
        } catch (error) {
            console.error("Failed to upload image", error);
            setError("بارگذاری عکس انجام نشد. لطفا دوباره تلاش کن.");
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setPreview(null);
        setPendingFile(null);
        setCaption("");
        setError("");
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment} afterLeave={resetForm}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={() => {
                    if (pendingFile) return;
                    handleClose();
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
                    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" />
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
                            <Dialog.Panel className="flex h-[min(720px,92vh)] w-full max-w-md transform flex-col overflow-hidden rounded-[30px] bg-[#f9fafc] shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition-all">
                                <div className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center px-5 py-4">
                                    <IconButton onClick={handleClose} label="Ø¨Ø³ØªÙ†" className="justify-self-end">
                                        <X className="h-5 w-5" />
                                    </IconButton>
                                    <h2 className="text-center text-base font-black text-slate-900">افزودن عکس جدید</h2>
                                    <span aria-hidden />
                                </div>

                                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4">
                                    <div className="grid gap-4">
                                        {preview ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setPreview(null);
                                                }}
                                                className="relative aspect-square w-full overflow-hidden rounded-[18px] bg-slate-100"
                                            >
                                                <Image
                                                    src={preview}
                                                    alt="پیش‌نمایش عکس"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </button>
                                        ) : (
                                            <label className="flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-[#155aa6] bg-white text-center text-[#155aa6] transition hover:bg-[#eef6ff]">
                                                <Upload className="mb-4 h-8 w-8" />
                                                <span className="text-[16px] font-black">بارگذاری عکس</span>
                                                <span className="mt-2 text-xs text-slate-400">JPG، PNG یا WEBP</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}

                                        <textarea
                                            value={caption}
                                            onChange={(event) => {
                                                setCaption(event.target.value);
                                                if (error) setError("");
                                            }}
                                            rows={5}
                                            dir="auto"
                                            className="w-full resize-none rounded-2xl border border-[#d6e1ee] bg-white px-4 py-3 text-start text-sm leading-7 text-slate-800 outline-none placeholder:text-right placeholder:text-slate-400 focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10"
                                            placeholder="هر عکسی یه داستانی داره؛ داستانتو اینجا بنویس!"
                                        />
                                        {error && (
                                            <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-600">
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 px-5 pb-6">
                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={!selectedFile || uploading}
                                        className="w-full rounded-full bg-[#155aa6] py-3 text-sm font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.32)] transition hover:bg-[#0f4e92] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                    >
                                        {uploading ? "در حال بارگذاری…" : "اشتراک گذاری"}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>

                <ImageAdjustModal
                    file={pendingFile}
                    isOpen={!!pendingFile}
                    title="تنظیم عکس گالری"
                    aspectRatio={1}
                    onCancel={() => setPendingFile(null)}
                    onConfirm={(file, previewUrl) => {
                        setSelectedFile(file);
                        setPreview(previewUrl);
                        setPendingFile(null);
                    }}
                />
            </Dialog>
        </Transition>
    );
}
