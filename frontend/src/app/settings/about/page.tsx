"use client";

import Image from "next/image";
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
                <Image src={logo} alt="چین ورس" width={118} height={118} className="mt-2 h-24 w-24 object-contain" priority />

                <div className="mt-7 space-y-5 text-right text-[14px] font-medium leading-8 text-[#2f3238]">
                    <p>
                        چین‌ورس یک اپلیکیشن جامع و چندمنظوره برای همه علاقه‌مندان به زبان و فرهنگ چینی است؛ جایی که می‌توانی زبان چینی را جدی، کاربردی و همراه با محتوای واقعی یاد بگیری.
                    </p>
                    <p>
                        در چین‌ورس می‌توانی فیلم و سریال چینی ببینی، پادکست گوش کنی، با متن‌های چینی کار کنی و مهارت‌های شنیداری، خواندن و درک مطلبت را تقویت کنی.
                    </p>
                    <p>
                        اما ماجرا فقط آموزش نیست؛ چین‌ورس فضایی برای ساختن پروفایل تخصصی، معرفی توانایی‌ها، ارائه خدمات، ارتباط با دیگران و رشد حرفه‌ای در حوزه زبان چینی است.
                    </p>
                    <p>
                        چین‌ورس فقط یک اپ نیست؛ یک جامعه زنده است برای رشد، یادگیری و همکاری. با چین‌ورس زبان چینی را زندگی کن.
                    </p>
                </div>

                <Image src={globeIcon} alt="" width={142} height={142} className="mt-8 h-36 w-36 object-contain" />

                <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-7 inline-flex min-w-[160px] items-center justify-center gap-2 rounded-[10px] bg-[#155aa6] px-5 py-3 text-sm font-black text-white shadow-[0_10px_20px_rgba(21,90,166,0.22)] transition hover:bg-[#0f4e92]"
                >
                    <Instagram size={18} />
                    اینستاگرام چین ورس
                </a>
            </main>
        </div>
    );
}
