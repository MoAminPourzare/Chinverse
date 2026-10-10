"use client";

import { Download, RefreshCw, Share2, Smartphone, Wifi, WifiOff } from "lucide-react";
import { AppHeader } from "@/components/ui/IconButton";
import Surface from "@/components/ui/Surface";
import { usePwa } from "@/components/pwa/PwaProvider";

export default function AppSettingsPage() {
    const {
        supported,
        installed,
        installAvailable,
        iosInstallHint,
        online,
        updateReady,
        install,
        applyUpdate,
        checkForUpdate,
    } = usePwa();

    return (
        <div className="min-h-full bg-[#f7f8fb] px-4 pb-8 pt-4" dir="rtl">
            <AppHeader title="نصب و دسترسی آفلاین" backHref="/settings" icon={<Smartphone className="h-5 w-5 text-[#155aa6]" />} />
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
                <Surface className="p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#155aa6]"><Download className="h-6 w-6" /></div>
                        <div><h2 className="font-black text-slate-900">نصب چین‌ورس</h2><p className="mt-1 text-xs font-bold text-slate-500">اجرای مستقل و دسترسی سریع از صفحه اصلی</p></div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-600">
                        {installed
                            ? "چین‌ورس روی این دستگاه به‌صورت standalone اجرا شده است."
                            : installAvailable
                                ? "مرورگر این دستگاه آمادهٔ نصب مستقیم چین‌ورس است."
                                : iosInstallHint
                                    ? "در Safari دکمهٔ Share و سپس Add to Home Screen را انتخاب کن."
                                    : "اگر دکمه نصب نمایش داده نمی‌شود، از منوی مرورگر گزینهٔ Install app یا Add to Home Screen را انتخاب کن."}
                    </div>
                    {installAvailable && !installed && <button type="button" onClick={() => void install()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-4 text-sm font-black text-white"><Download className="h-5 w-5" />نصب برنامه</button>}
                    {iosInstallHint && !installed && <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#d5e1ef] px-4 py-3 text-xs font-bold leading-6 text-slate-600"><Share2 className="h-5 w-5 shrink-0 text-[#155aa6]" />Safari → Share → Add to Home Screen</div>}
                </Surface>

                <Surface className="p-5">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${online ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{online ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}</div>
                        <div><h2 className="font-black text-slate-900">وضعیت اتصال</h2><p className="mt-1 text-xs font-bold text-slate-500">{online ? "آنلاین" : "آفلاین"}</p></div>
                    </div>
                    <p className="mt-4 text-sm font-bold leading-7 text-slate-600">در حالت آفلاین فقط shell و صفحهٔ راهنما در دسترس است؛ API، حساب و رسانهٔ خصوصی cache نمی‌شوند.</p>
                </Surface>

                <Surface className="p-5">
                    <div className="flex items-center gap-3"><RefreshCw className="h-6 w-6 text-[#155aa6]" /><div><h2 className="font-black text-slate-900">به‌روزرسانی</h2><p className="mt-1 text-xs font-bold text-slate-500">{updateReady ? "نسخهٔ تازه آماده است" : "بررسی دستی نسخه"}</p></div></div>
                    <button type="button" onClick={updateReady ? applyUpdate : () => void checkForUpdate()} disabled={!supported} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d5e1ef] bg-white px-4 text-sm font-black text-[#155aa6] disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className="h-5 w-5" />{updateReady ? "اعمال به‌روزرسانی" : "بررسی به‌روزرسانی"}</button>
                </Surface>
            </main>
        </div>
    );
}

