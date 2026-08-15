import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <main className="flex min-h-full items-center justify-center px-5 py-10" dir="rtl">
            <section className="w-full max-w-[380px] rounded-[30px] border border-[#d5e1ef] bg-white p-7 text-center shadow-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-amber-50 text-amber-700"><WifiOff className="h-8 w-8" /></div>
                <h1 className="mt-5 text-xl font-black text-slate-900">اتصال اینترنت در دسترس نیست</h1>
                <p className="mt-3 text-sm font-bold leading-8 text-slate-600">برای حفاظت از اطلاعات، حساب کاربری، API و رسانه‌های خصوصی آفلاین ذخیره نمی‌شوند. بعد از وصل‌شدن دوباره تلاش کن.</p>
                <Link href="/" className="touch-target mt-6 inline-flex items-center justify-center rounded-2xl bg-[#155aa6] px-6 text-sm font-black text-white">تلاش دوباره</Link>
            </section>
        </main>
    );
}
