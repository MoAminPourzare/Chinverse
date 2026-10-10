"use client";

import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import PostComments from "@/components/engagement/PostComments";

interface Props {
    postId: number;
    ownerId?: number;
    initialCount: number;
    onCountChange: (count: number) => void;
    onClose: () => void;
}

export default function PostCommentsSheet({ postId, ownerId, initialCount, onCountChange, onClose }: Props) {
    return (
        <Dialog open onClose={onClose} className="fixed inset-0 z-[140]" dir="rtl">
            <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-end justify-center">
                <Dialog.Panel className="flex h-[min(560px,calc(var(--app-visual-height,100dvh)-24px))] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px] border border-[var(--app-border)] bg-[var(--app-canvas)] p-4 shadow-[0_-12px_48px_rgba(15,23,42,0.2)]">
                    <header className="flex shrink-0 items-center justify-between gap-3 pb-3">
                        <Dialog.Title className="text-base font-black text-slate-950">دیدگاه‌های پست</Dialog.Title>
                        <button type="button" onClick={onClose} aria-label="بستن دیدگاه‌ها" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"><X size={20} /></button>
                    </header>
                    <PostComments postId={postId} ownerId={ownerId} initialCount={initialCount} onCountChange={onCountChange} defaultOpen showToggle={false} contained />
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
