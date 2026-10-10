"use client";

import { Dialog, DialogDescription, DialogPanel, DialogTitle } from "@headlessui/react";
import { Check, Copy, X } from "lucide-react";
import { useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { getSocialLinkRel, getSocialLinkTarget, getSocialPlatform, getSocialProfileUrl, normalizeSocialHandle } from "@/lib/socialLinks";

export default function ProfileSocialLink({ platformId, handle, className, iconClassName }: {
    platformId: string;
    handle: string;
    className: string;
    iconClassName?: string;
}) {
    const platform = getSocialPlatform(platformId);
    const Icon = platform.icon;
    const wechatId = normalizeSocialHandle("wechat", handle);
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState("");
    const [copying, setCopying] = useState(false);
    const idInput = useRef<HTMLInputElement>(null);
    const classes = cn("w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155aa6]", className);
    const content = <>
        <span aria-hidden="true" className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#155aa6] shadow-sm", iconClassName)}><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 text-right font-bold">{platform.name}</span>
        <span dir="ltr" className="truncate text-left text-xs text-slate-500">{platform.id === "wechat" ? wechatId : handle}</span>
    </>;

    if (platform.id !== "wechat") return <a href={getSocialProfileUrl(platformId, handle) ?? undefined} target={getSocialLinkTarget(platformId)} rel={getSocialLinkRel(platformId)} className={classes}>{content}</a>;

    async function copyId() {
        setCopied(false);
        setCopyError("");
        setCopying(true);
        try {
            await navigator.clipboard.writeText(wechatId);
            setCopied(true);
        } catch {
            setCopyError("کپی خودکار انجام نشد. آیدی را انتخاب و کپی کن.");
            idInput.current?.focus();
            idInput.current?.select();
        } finally { setCopying(false); }
    }

    return <>
        <button type="button" onClick={() => { setCopied(false); setCopyError(""); setOpen(true); }} aria-haspopup="dialog" className={classes}>{content}</button>
        <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 z-[180]" dir="rtl">
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
                <DialogPanel className="w-full max-w-sm rounded-[28px] bg-white p-5 text-right shadow-2xl">
                    <div className="relative mb-5 flex min-h-11 items-center justify-center">
                        <IconButton label="بستن" onClick={() => setOpen(false)} className="absolute left-0"><X size={18} /></IconButton>
                        <DialogTitle className="px-12 text-base font-black text-slate-900">ارتباط در وی‌چت</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm leading-7 text-slate-600">برای پیدا کردن این کاربر، آیدی زیر را در وی‌چت جستجو کن.</DialogDescription>
                    <label htmlFor={`wechat-id-${wechatId}`} className="mb-2 mt-5 block text-xs font-bold text-slate-700">آیدی وی‌چت</label>
                    <input ref={idInput} id={`wechat-id-${wechatId}`} value={wechatId} readOnly dir="ltr" onFocus={event => event.currentTarget.select()} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-sm font-bold text-slate-900 outline-none focus:border-[#155aa6] focus:ring-2 focus:ring-blue-100" />
                    <button type="button" disabled={copying} onClick={() => void copyId()} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#155aa6] text-sm font-bold text-white disabled:opacity-60">{copied ? <Check aria-hidden size={18} /> : <Copy aria-hidden size={18} />}{copied ? "آیدی کپی شد" : "کپی آیدی"}</button>
                    {copied && <p role="status" className="mt-2 text-xs leading-6 text-[#155aa6]">آیدی وی‌چت کپی شد.</p>}
                    {copyError && <p role="alert" className="mt-2 text-xs leading-6 text-red-600">{copyError}</p>}
                    <p className="mt-5 rounded-2xl bg-blue-50 p-3 text-xs leading-7 text-slate-600">وی‌چت را باز کن، روی «+» و سپس «Add Contacts» بزن و این آیدی را در قسمت جستجو وارد کن.</p>
                </DialogPanel>
            </div>
        </Dialog>
    </>;
}
