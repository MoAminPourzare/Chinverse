"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram } from "lucide-react";
import { AppHeader } from "@/components/ui/IconButton";

const logo = "/assets/chinverse/logos/chinverse-logo.png";
const aboutIcon = "/assets/chinverse/icons/About chinverse.svg";
const globeIcon = "/assets/chinverse/icons/Globe.svg";

export default function SettingsAboutPage() {
    return (
        <div className="min-h-full bg-[#f7f8fb] px-5 pb-10 pt-4" dir="rtl">
            <AppHeader
                title="درباره چین ورس"
                backHref="/settings"
                iconClassName="bg-transparent shadow-none ring-0"
                icon={<Image src={aboutIcon} alt="" width={32} height={32} className="h-8 w-8 object-contain" />}
            />

            <main className="mx-auto flex w-full max-w-[430px] flex-col items-center text-center">
                <Image src={logo} alt="چین ورس" width={118} height={118} className="mt-1 h-20 w-20 object-contain" priority />

                <div className="mt-5 space-y-4 text-right text-[13px] font-medium leading-7 text-[#2f3238]">
                    <p>
                        چین‌ورس یک اپلیکیشن جامع و چندمنظوره برای همه علاقه‌مندان به زبان و فرهنگ چینه. اینجا جاییه که می‌تونی همزمان زبان چینی یاد بگیری، فیلم و سریال چینی ببینی، کتاب بخونی و با دنیای واقعی چینی‌ها آشنا بشی. همچنین می‌تونی مهارت‌های شنیداری، خواندن و درک مطلبت رو تقویت کنی.
                    </p>
                    <p className="text-center font-black">
                        اما ماجرا فقط آموزش نیست!
                    </p>
                    <p>
                        در چین‌ورس می‌تونی رزومه‌ات رو بسازی، خدماتت رو معرفی کنی و با افرادی که مثل تو در حوزه چین، زبان چینی فعالن یا به کسب‌وکار و همکاری با چین چه مدرس باشی، چه مترجم، چه تولیدکننده محتوا، چه بازرگان، یا حتی فقط یک زبان‌آموز علاقه‌مند، چین‌ورس یه پلتفرم زنده‌ست برای یادگیری، تعامل، رشد شخصی و معرفی تخصصت.
                    </p>
                    <p>
                        چین‌ورس فقط یک اپ نیست؛ یک جامعه زنده‌ست برای رشد، یادگیری و همکاری.
                    </p>
                    <p className="text-center font-black">
                        با چین‌ورس، زبان چینی رو زندگی کن!
                    </p>
                </div>

                <Image src={globeIcon} alt="" width={142} height={142} className="mt-5 h-28 w-28 object-contain" />

                <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex min-w-[160px] items-center justify-center gap-2 rounded-[10px] bg-[#155aa6] px-5 py-3 text-sm font-black text-white shadow-[0_10px_20px_rgba(21,90,166,0.22)] transition hover:bg-[#0f4e92]"
                >
                    <Instagram size={18} />
                    اینستاگرام چین ورس
                </a>

                <nav className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-bold text-[#155aa6]" aria-label="اسناد حقوقی">
                    <Link href="/legal/privacy" className="hover:text-[#0f4e92]">حریم خصوصی</Link>
                    <Link href="/legal/terms" className="hover:text-[#0f4e92]">شرایط استفاده</Link>
                    <Link href="/legal/community-guidelines" className="hover:text-[#0f4e92]">قوانین جامعه</Link>
                </nav>
            </main>
        </div>
    );
}
