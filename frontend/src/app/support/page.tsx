'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Send } from 'lucide-react';
import { communityService } from '@/services/community.service';

type Screen = 'input' | 'success';

export default function SupportPage() {
    const router = useRouter();
    const [screen, setScreen] = useState<Screen>('input');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await communityService.submitSupportTicket({ message: message.trim() });
            setScreen('success');
        } catch (error) {
            console.error('Failed to submit support ticket:', error);
            alert('خطا در ارسال پیام. لطفا دوباره تلاش کنید.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        router.push('/community');
    };

    if (screen === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center p-4" dir="rtl">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[80vh] relative flex flex-col">
                    {/* Header */}
                    <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-blue-800 tracking-tighter">ChinVerse</span>
                            <span className="text-lg">🐉</span>
                        </div>
                        <div className="w-9" />
                    </header>

                    {/* Success Content */}
                    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                        {/* Girl Avatar Illustration */}
                        <div className="relative mb-8">
                            <svg viewBox="0 0 140 140" className="w-36 h-36">
                                {/* Head outline */}
                                <ellipse cx="70" cy="70" rx="45" ry="50" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                                {/* Hair */}
                                <path d="M25 70 Q25 30 70 25 Q115 30 115 70" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                                <path d="M25 70 Q20 90 25 110" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                                <path d="M115 70 Q120 90 115 110" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                                {/* Face */}
                                <circle cx="55" cy="65" r="3" fill="#1e3a5f" />
                                <circle cx="85" cy="65" r="3" fill="#1e3a5f" />
                                <path d="M60 82 Q70 88 80 82" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                                {/* Neck */}
                                <rect x="60" y="115" width="20" height="15" fill="none" stroke="#d97706" strokeWidth="2" />
                                {/* Shoulder hint */}
                                <path d="M50 130 Q70 125 90 130" fill="none" stroke="#d97706" strokeWidth="2" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            پیامت به دست ما رسید!
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                            تیم پشتیبانی چین‌ورس به‌زودی بررسیش می‌کنه و پاسخ میده. ممنون که با ما در ارتباط هستی.
                        </p>

                        <button
                            onClick={handleClose}
                            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            بازگشت
                        </button>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[80vh] relative flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-blue-800 tracking-tighter">ChinVerse</span>
                        <span className="text-lg">🐉</span>
                    </div>
                    <div className="w-9" />
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col px-6 py-8">
                    {/* Welcome Message */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">سلام!</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            به پشتیبانی چین‌ورس خوش اومدی. لطفا سوال یا مشکلی که داری رو برامون بنویس تا در اسرع وقت بهش رسیدگی بشه.
                        </p>
                    </div>

                    {/* Girl Avatar Illustration */}
                    <div className="flex justify-center mb-8">
                        <svg viewBox="0 0 140 140" className="w-32 h-32">
                            {/* Head outline */}
                            <ellipse cx="70" cy="70" rx="45" ry="50" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                            {/* Hair */}
                            <path d="M25 70 Q25 30 70 25 Q115 30 115 70" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                            <path d="M25 70 Q20 90 25 110" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                            <path d="M115 70 Q120 90 115 110" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                            {/* Face */}
                            <circle cx="55" cy="65" r="3" fill="#1e3a5f" />
                            <circle cx="85" cy="65" r="3" fill="#1e3a5f" />
                            <path d="M60 82 Q70 88 80 82" fill="none" stroke="#1e3a5f" strokeWidth="2" />
                            {/* Neck */}
                            <rect x="60" y="115" width="20" height="15" fill="none" stroke="#d97706" strokeWidth="2" />
                            {/* Shoulder hint */}
                            <path d="M50 130 Q70 125 90 130" fill="none" stroke="#d97706" strokeWidth="2" />
                        </svg>
                    </div>

                    {/* Input Area */}
                    <div className="flex-1 flex flex-col">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="پیامتو اینجا بنویس..."
                                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm resize-none min-h-[120px]"
                                rows={5}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!message.trim() || isSubmitting}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    ارسال پیام
                                </>
                            )}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
