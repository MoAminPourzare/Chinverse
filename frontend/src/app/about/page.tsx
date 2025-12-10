'use client';

import Link from 'next/link';
import { ArrowRight, Instagram } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[80vh] relative flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                    <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">درباره چین ورس</h1>
                    <div className="w-9" />
                </header>

                {/* Content */}
                <main className="flex-1 px-6 py-8 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <svg viewBox="0 0 100 100" className="w-24 h-24">
                                {/* Stylized dragon/wave logo */}
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e40af" strokeWidth="2" />
                                <path
                                    d="M30 50 Q40 30 50 50 Q60 70 70 50"
                                    fill="none"
                                    stroke="#1e40af"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <circle cx="35" cy="45" r="4" fill="#f97316" />
                                <circle cx="65" cy="55" r="4" fill="#f97316" />
                            </svg>
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-800">چین ورس</span>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-6 text-gray-600 text-sm leading-relaxed text-justify">
                        <p>
                            <strong className="text-gray-900">چین‌ورس</strong> یک اپلیکیشن جامع و چندمنظوره برای همه علاقه‌مندان به زبان و فرهنگ چینه. اینجا جاییه که می‌تونی همزمان زبان چینی یاد بگیری، فیلم و سریال چینی ببینی، کتاب بخونی و با دنیای واقعی چینی‌ها آشنا بشی.
                        </p>
                        <p>
                            همچنین می‌تونی مهارت‌های شنیداری، خواندن و درک مطلب رو تقویت کنی.
                        </p>
                        <p>
                            <strong className="text-gray-900">اما ماجرا فقط آموزش نیست!</strong>
                        </p>
                        <p>
                            در چین‌ورس، می‌تونی رزومت رو بسازی، خدماتت رو معرفی کنی و با افرادی که مثل تو در حوزه زبان چینی فعال‌اند، چه مدرس باشی، مترجم، تولیدکننده محتوا یا فقط یک زبان‌آموز علاقه‌مند، شبکه‌سازی و همکاری کنی.
                        </p>
                        <p>
                            چین‌ورس یه پلتفرم زنده‌ست برای یادگیری، تعامل، رشد شخصی و معرفی تخصصیات.
                        </p>
                        <p className="font-bold text-gray-900">
                            چین‌ورس فقط یک اپ نیست، یک جامعه زنده است برای رشد، یادگیری و همکاری.
                        </p>
                        <p className="text-center font-bold text-blue-800 text-base mt-6">
                            با چین ورس زبان چینی رو زندگی کن!
                        </p>
                    </div>

                    {/* Globe Illustration */}
                    <div className="flex justify-center mt-8 mb-6">
                        <svg viewBox="0 0 120 120" className="w-32 h-32">
                            {/* Globe */}
                            <circle cx="60" cy="60" r="45" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                            {/* Horizontal lines */}
                            <ellipse cx="60" cy="40" rx="40" ry="12" fill="none" stroke="#1e3a5f" strokeWidth="1" />
                            <ellipse cx="60" cy="60" rx="45" ry="15" fill="none" stroke="#1e3a5f" strokeWidth="1" />
                            <ellipse cx="60" cy="80" rx="40" ry="12" fill="none" stroke="#1e3a5f" strokeWidth="1" />
                            {/* Vertical line */}
                            <ellipse cx="60" cy="60" rx="15" ry="45" fill="none" stroke="#1e3a5f" strokeWidth="1" />
                            {/* Decorative circles */}
                            <circle cx="40" cy="50" r="8" fill="#f97316" opacity="0.8" />
                            <circle cx="80" cy="70" r="6" fill="#f97316" opacity="0.6" />
                            <circle cx="55" cy="75" r="5" fill="#f97316" opacity="0.4" />
                        </svg>
                    </div>
                </main>

                {/* Footer - Instagram Button */}
                <footer className="px-6 py-4 border-t border-gray-100">
                    <a
                        href="https://instagram.com/chinverse"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full py-4 bg-blue-800 text-white rounded-2xl font-bold text-base hover:bg-blue-900 transition-colors"
                    >
                        <Instagram className="w-5 h-5" />
                        اینستاگرام چین ورس
                    </a>
                </footer>
            </div>
        </div>
    );
}
