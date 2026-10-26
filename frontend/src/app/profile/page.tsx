"use client";

import Image from "@/components/ui/PublicMediaImage";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Camera, Loader2, Settings, UserRound } from "lucide-react";
import { authService } from "@/services/auth.service";
import { userService, type User } from "@/services/user.service";
import { isHttpStatus } from "@/lib/http";
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps } from "@/lib/textDirection";
import ImageAdjustModal from "@/components/ui/ImageAdjustModal";
import NotificationBellLink from "@/components/notifications/NotificationBellLink";
import LearningRoadmap from "@/components/profile/LearningRoadmap";
import { IMAGE_FILE_ACCEPT, isAdjustableImageFile, validateImageFile } from "@/validation";

export default function ProfilePage() {
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const requestRef = useRef(0);
    const [user, setUser] = useState<User | null>();
    const [loadError, setLoadError] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
    const [avatarError, setAvatarError] = useState("");

    const loadUser = useCallback(async () => {
        const request = ++requestRef.current;
        setLoadError(false);
        try {
            const authenticated = await authService.restoreSession();
            const me = authenticated ? await userService.getMe() : null;
            if (request === requestRef.current) setUser(me);
        } catch (error) {
            if (request !== requestRef.current) return;
            if (isHttpStatus(error, 401)) setUser(null);
            else setLoadError(true);
        }
    }, []);

    const cancelLoad = useCallback(() => { requestRef.current++; }, []);
    useEffect(() => {
        void loadUser();
        window.addEventListener("chinverse-auth-change", loadUser);
        return () => { cancelLoad(); window.removeEventListener("chinverse-auth-change", loadUser); };
    }, [loadUser, cancelLoad]);

    const uploadAvatar = async (file: File) => {
        setPendingAvatar(null);
        setUploading(true);
        setAvatarError("");
        try { setUser(await userService.uploadAvatar(file)); }
        catch { setAvatarError("عکس ذخیره نشد. دوباره تلاش کن."); }
        finally { setUploading(false); }
    };
    const displayName = user?.profile?.display_name?.trim() || "زبان‌آموز چین‌ورس";

    return (
        <div className="min-h-full bg-[#f3f8fc] pb-8 dark:bg-[#10151c]" dir="rtl">
            <header data-page-header className="flex h-[72px] items-center justify-between border-b border-[#e1ebf4] bg-white/90 px-4 dark:border-slate-700 dark:bg-[#171d26]">
                <nav className="flex items-center gap-1" aria-label="ابزارهای پروفایل">
                    <Link href="/settings" className="flex size-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-blue-50 dark:text-slate-200" aria-label="تنظیمات"><Settings size={22} /></Link>
                    <NotificationBellLink />
                    <Link href="/profile/collections" className="flex size-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-blue-50 dark:text-slate-200" aria-label="مجموعه‌های منتخب"><Bookmark size={22} /></Link>
                </nav>
                <Link href="/" aria-label="چین‌ورس"><Image src="/assets/chinverse/logos/chinverse-wordmark.png" alt="لوگوی چین‌ورس" width={156} height={65} className="h-auto w-[140px] object-contain sm:w-[156px]" priority /></Link>
            </header>
            <main className="mx-auto w-full max-w-[460px]">
                <section className="relative isolate overflow-hidden px-5 pb-9 pt-7 text-center">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[url('/assets/chinverse/learning-landscape.svg')] bg-cover bg-center opacity-80 dark:opacity-20" />
                    {loadError ? <div role="alert" className="rounded-2xl bg-white/95 p-4 text-sm leading-7 text-slate-700 dark:bg-slate-800 dark:text-slate-200">اطلاعات حساب دریافت نشد.<button type="button" onClick={() => void loadUser()} className="mx-auto mt-2 block min-h-11 px-4 font-bold text-[#155aa6] dark:text-blue-300">تلاش دوباره</button></div>
                    : user === undefined ? <div role="status" aria-label="در حال دریافت پروفایل" className="mx-auto flex h-40 items-center justify-center"><Loader2 className="size-7 animate-spin text-[#155aa6]" /></div>
                    : user ? <>
                        <input ref={avatarInputRef} type="file" accept={IMAGE_FILE_ACCEPT} className="hidden" onChange={(event) => {
                            const file = event.target.files?.[0]; event.target.value = "";
                            if (!file || uploading) return;
                            const validation = validateImageFile(file, { maxMb: 5 });
                            if (!validation.ok) { setAvatarError(validation.message); return; }
                            setAvatarError("");
                            if (isAdjustableImageFile(file)) setPendingAvatar(file); else void uploadAvatar(file);
                        }} />
                        <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploading} aria-label="تغییر عکس پروفایل" className="group relative mx-auto flex size-28 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#1688e8] bg-[#fffdf3] shadow-[0_8px_24px_rgba(21,90,166,.12)] disabled:opacity-70">
                            {user.profile?.avatar_url ? <Image src={getMediaUrl(user.profile.avatar_url)} alt="عکس پروفایل" fill sizes="112px" className="object-cover" unoptimized /> : <UserRound aria-hidden className="size-12 text-[#a4bfce]" strokeWidth={1.3} />}
                            <span className={`absolute inset-0 items-center justify-center bg-slate-950/35 text-white ${uploading ? "flex" : "hidden group-hover:flex group-focus-visible:flex"}`}>{uploading ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}</span>
                        </button>
                        <h1 className="mt-4 break-words text-[22px] font-black leading-9 text-[#20294e] dark:text-white" {...getDirectionalTextProps(displayName)}>{displayName}</h1>
                        {avatarError && <p role="alert" className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs leading-6 text-rose-700">{avatarError}</p>}
                    </> : <div className="rounded-3xl bg-white/90 px-4 py-6 dark:bg-slate-800/90">
                        <h1 className="text-xl font-black text-[#20294e] dark:text-white">مسیر یادگیری خودت را شروع کن</h1>
                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">با ورود به حساب، پیشرفت درس‌هایت برایت ذخیره می‌شود.</p>
                        <Link href="/login?next=%2Fprofile" className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-[#155aa6] px-6 text-sm font-bold text-white">ورود به حساب</Link>
                    </div>}
                </section>
                {user && <LearningRoadmap key={user.id} />}
            </main>
            <ImageAdjustModal file={pendingAvatar} isOpen={Boolean(pendingAvatar)} title="تنظیم عکس پروفایل" aspectRatio={1} frameClassName="rounded-full" onCancel={() => setPendingAvatar(null)} onConfirm={(file) => void uploadAvatar(file)} />
        </div>
    );
}
