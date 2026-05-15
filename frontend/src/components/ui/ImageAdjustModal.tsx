"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ImageIcon, Loader2, Minus, Plus, RotateCcw, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { cn } from "@/lib/cn";

interface ImageAdjustModalProps {
    file: File | null;
    isOpen: boolean;
    title?: string;
    aspectRatio?: number;
    frameClassName?: string;
    outputType?: "image/jpeg" | "image/png" | "image/webp";
    outputQuality?: number;
    onCancel: () => void;
    onConfirm: (file: File, previewUrl: string) => void;
}

type DragState = {
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function ImageAdjustModal({
    file,
    isOpen,
    title = "تنظیم تصویر",
    aspectRatio = 1,
    frameClassName,
    outputType = "image/jpeg",
    outputQuality = 0.92,
    onCancel,
    onConfirm,
}: ImageAdjustModalProps) {
    const imageRef = useRef<HTMLImageElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isSaving, setIsSaving] = useState(false);

    const outputExtension = useMemo(() => {
        if (outputType === "image/png") return "png";
        if (outputType === "image/webp") return "webp";
        return "jpg";
    }, [outputType]);

    useEffect(() => {
        if (!file || !isOpen) {
            setImageUrl(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setImageUrl(url);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setImageSize({ width: 0, height: 0 });
        setFrameSize({ width: 0, height: 0 });

        return () => URL.revokeObjectURL(url);
    }, [file, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const updateFrameSize = () => {
            const frame = frameRef.current;
            if (!frame) return;

            const rect = frame.getBoundingClientRect();
            setFrameSize({ width: rect.width, height: rect.height });
        };

        updateFrameSize();
        const animationFrame = window.requestAnimationFrame(updateFrameSize);
        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateFrameSize) : null;

        if (frameRef.current) resizeObserver?.observe(frameRef.current);
        window.addEventListener("resize", updateFrameSize);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updateFrameSize);
        };
    }, [isOpen, aspectRatio]);

    if (!isOpen || !file || !imageUrl) return null;

    const getFrameSize = () => {
        if (frameSize.width && frameSize.height) return frameSize;
        const frame = frameRef.current;
        if (!frame) return { width: 1, height: 1 };
        const rect = frame.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
    };

    const getBaseScale = () => {
        const frame = getFrameSize();
        if (!imageSize.width || !imageSize.height) return 1;
        return Math.max(frame.width / imageSize.width, frame.height / imageSize.height);
    };

    const constrainOffset = (nextOffset: { x: number; y: number }, nextZoom = zoom) => {
        const frame = getFrameSize();
        const baseScale = getBaseScale();
        const renderedWidth = imageSize.width * baseScale * nextZoom;
        const renderedHeight = imageSize.height * baseScale * nextZoom;
        const maxX = Math.max((renderedWidth - frame.width) / 2, 0);
        const maxY = Math.max((renderedHeight - frame.height) / 2, 0);

        return {
            x: clamp(nextOffset.x, -maxX, maxX),
            y: clamp(nextOffset.y, -maxY, maxY),
        };
    };

    const updateZoom = (nextZoom: number) => {
        const normalizedZoom = clamp(nextZoom, 1, 3);
        setZoom(normalizedZoom);
        setOffset((current) => constrainOffset(current, normalizedZoom));
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startOffsetX: offset.x,
            startOffsetY: offset.y,
        };
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;

        const nextOffset = {
            x: drag.startOffsetX + event.clientX - drag.startX,
            y: drag.startOffsetY + event.clientY - drag.startY,
        };
        setOffset(constrainOffset(nextOffset));
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
        }
    };

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const target = event.currentTarget;
        setImageSize({
            width: target.naturalWidth,
            height: target.naturalHeight,
        });
        setOffset({ x: 0, y: 0 });
        setZoom(1);
    };

    const resetAdjustments = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    const handleConfirm = async () => {
        const image = imageRef.current;
        if (!image || !imageSize.width || !imageSize.height) return;

        setIsSaving(true);
        try {
            const outputWidth = aspectRatio >= 1 ? 1400 : Math.round(1400 * aspectRatio);
            const outputHeight = Math.round(outputWidth / aspectRatio);
            const canvas = document.createElement("canvas");
            canvas.width = outputWidth;
            canvas.height = outputHeight;

            const context = canvas.getContext("2d");
            if (!context) return;

            const frame = getFrameSize();
            const baseScale = getBaseScale();
            const totalScale = baseScale * zoom;
            const visibleWidthInSource = frame.width / totalScale;
            const visibleHeightInSource = frame.height / totalScale;
            const sourceCenterX = imageSize.width / 2 - offset.x / totalScale;
            const sourceCenterY = imageSize.height / 2 - offset.y / totalScale;
            const sourceX = clamp(sourceCenterX - visibleWidthInSource / 2, 0, imageSize.width - visibleWidthInSource);
            const sourceY = clamp(sourceCenterY - visibleHeightInSource / 2, 0, imageSize.height - visibleHeightInSource);

            context.drawImage(
                image,
                sourceX,
                sourceY,
                visibleWidthInSource,
                visibleHeightInSource,
                0,
                0,
                outputWidth,
                outputHeight,
            );

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, outputType, outputQuality);
            });
            if (!blob) return;

            const originalName = file.name.replace(/\.[^.]+$/, "");
            const croppedFile = new File([blob], `${originalName}-adjusted.${outputExtension}`, {
                type: outputType,
                lastModified: Date.now(),
            });
            const previewUrl = canvas.toDataURL(outputType, outputQuality);
            onConfirm(croppedFile, previewUrl);
        } finally {
            setIsSaving(false);
        }
    };

    const baseScale = getBaseScale();
    const renderedWidth = Math.max(1, imageSize.width * baseScale * zoom);
    const renderedHeight = Math.max(1, imageSize.height * baseScale * zoom);

    return (
        <div className="fixed inset-0 z-[180] flex items-end justify-center bg-slate-950/70 px-3 pb-3 backdrop-blur-sm" dir="rtl">
            <div className="flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-[34px] border border-white/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.32)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-black text-slate-950">{title}</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-400">عکس را بکش، زوم کن و کادر نهایی را تنظیم کن.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                        aria-label="بستن"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    <div
                        ref={frameRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className={cn(
                            "relative mx-auto w-full touch-none select-none overflow-hidden rounded-[28px] bg-slate-950 shadow-inner",
                            frameClassName,
                        )}
                        style={{ aspectRatio }}
                    >
                        <Image
                            ref={imageRef}
                            src={imageUrl}
                            alt="تنظیم تصویر"
                            width={Math.round(renderedWidth)}
                            height={Math.round(renderedHeight)}
                            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                            style={{
                                width: `${renderedWidth}px`,
                                height: `${renderedHeight}px`,
                                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                                transformOrigin: "center",
                            }}
                            onLoad={handleImageLoad}
                            unoptimized
                        />
                        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/25" />
                        <div className="pointer-events-none absolute inset-3 rounded-[22px] border border-white/45" />
                    </div>

                    <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => updateZoom(zoom - 0.1)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                                aria-label="کوچک کردن"
                            >
                                <Minus size={18} />
                            </button>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onChange={(event) => updateZoom(Number(event.target.value))}
                                className="h-1 flex-1 accent-rose-500"
                            />
                            <button
                                type="button"
                                onClick={() => updateZoom(zoom + 0.1)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
                                aria-label="بزرگ کردن"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                                <ImageIcon size={15} />
                                زوم {Math.round(zoom * 100)}٪
                            </span>
                            <button
                                type="button"
                                onClick={resetAdjustments}
                                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-500 shadow-sm transition hover:text-slate-800"
                            >
                                <RotateCcw size={14} />
                                ریست
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-white p-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                    >
                        انصراف
                    </button>
                    <PrimaryButton
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSaving || !imageSize.width}
                        leadingIcon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    >
                        تایید تصویر
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
