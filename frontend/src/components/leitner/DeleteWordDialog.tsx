"use client";

import { Dialog, DialogDescription, DialogPanel, DialogTitle } from "@headlessui/react";

export default function DeleteWordDialog({ word, pending, error, onConfirm, onClose }: {
    word: string | null;
    pending: boolean;
    error: string | null;
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <Dialog open={word !== null} onClose={() => { if (!pending) onClose(); }} className="relative z-[1100]" dir="rtl">
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-5">
                <DialogPanel className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
                    <DialogTitle className="text-lg font-black text-slate-950">حذف لغت از لایتنر</DialogTitle>
                    <DialogDescription className="mt-4 text-sm leading-7 text-slate-600">آیا مطمئنی که می‌خوای این لغت رو از لایتنرت حذف کنی؟</DialogDescription>
                    <div className="font-cjk mt-3 text-center text-2xl text-slate-900" lang="zh-CN" dir="ltr">{word}</div>
                    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button type="button" onClick={onConfirm} disabled={pending} className="min-h-12 rounded-full bg-red-700 font-bold text-white disabled:opacity-60">{pending ? "در حال حذف…" : "آره"}</button>
                        <button type="button" data-autofocus onClick={onClose} disabled={pending} className="min-h-12 rounded-full bg-slate-100 font-bold text-slate-700 disabled:opacity-60">نه</button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
