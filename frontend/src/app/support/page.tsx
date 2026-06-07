'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { communityService } from '@/services/community.service';
import { IconButton } from '@/components/ui/IconButton';
import { validateTextLength, validationMessage } from '@/validation';

type Screen = 'input' | 'success';

const CHINVERSE_BLUE = '#155aa6';

export default function SupportPage() {
    const router = useRouter();
    const [screen, setScreen] = useState<Screen>('input');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleClose = () => {
        router.back();
    };

    const handleSubmit = async () => {
        const trimmed = message.trim();
        const validationError = validationMessage(validateTextLength(trimmed, 'پیام پشتیبانی', { required: true, min: 10, max: 4000 }));
        setError(validationError);
        if (validationError || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await communityService.submitSupportTicket({ message: trimmed });
            setScreen('success');
            setMessage('');
        } catch (error) {
            console.error('Failed to submit support ticket:', error);
            setError('ارسال پیام انجام نشد. لطفا کمی بعد دوباره تلاش کن.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col bg-[#f7f8fa] px-5 pb-8 pt-5" dir="rtl">
            <header className="grid grid-cols-[44px_1fr_44px] items-center">
                <IconButton onClick={handleClose} label="بستن" className="justify-self-end">
                    <X size={20} />
                </IconButton>

                <div className="flex justify-center">
                    <Image
                        src="/assets/chinverse/logos/chinverse-logo.png"
                        alt="چین ورس"
                        width={116}
                        height={36}
                        className="h-auto w-[116px] object-contain"
                        priority
                    />
                </div>

                <span aria-hidden />
            </header>

            {screen === 'success' ? (
                <main className="flex flex-1 flex-col items-center justify-center text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#155aa6]/10 text-[#155aa6]">
                        <CheckCircle2 size={48} strokeWidth={1.8} />
                    </div>
                    <h1 className="mt-7 text-xl font-black text-slate-900">پیامت ثبت شد</h1>
                    <p className="mt-3 max-w-[280px] text-sm leading-7 text-slate-500">
                        تیم پشتیبانی چین ورس پیام تو را بررسی می‌کند و در اولین فرصت پاسخ می‌دهد.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push('/community')}
                        className="mt-8 h-[52px] w-full max-w-[295px] rounded-[22px] bg-[#155aa6] px-6 text-base font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.26)] transition hover:bg-[#0f4f96] focus:outline-none focus:ring-4 focus:ring-[#155aa6]/20"
                    >
                        بازگشت به پیام‌ها
                    </button>
                </main>
            ) : (
                <main className="flex flex-1 flex-col">
                    <section className="mt-12 text-right">
                        <p className="text-sm font-bold leading-8 text-slate-800">سلام؛</p>
                        <p className="mt-1 text-[13px] font-medium leading-8 text-slate-700">
                            به پشتیبانی چین ورس خوش اومدی، لطفا سوال یا مشکلی که داری رو برامون بنویس تا در اسرع وقت بهش رسیدگی بشه.
                        </p>
                    </section>

                    <div className="mt-8 flex justify-center">
                        <Image
                            src="/assets/chinverse/icons/Support & Help.svg"
                            alt=""
                            width={176}
                            height={176}
                            className="h-[176px] w-[176px] object-contain"
                            priority
                        />
                    </div>

                    <div className="mt-8">
                        <textarea
                            value={message}
                            onChange={(event) => {
                                setMessage(event.target.value);
                                if (error) setError('');
                            }}
                            placeholder="پیامتو اینجا بنویس"
                            rows={3}
                            className="min-h-[72px] w-full resize-none rounded-[4px] border border-[#155aa6] bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#e88e6e] focus:ring-4 focus:ring-[#155aa6]/10"
                        />
                        {error && (
                            <p className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-600">
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!message.trim() || isSubmitting}
                            style={{ backgroundColor: CHINVERSE_BLUE }}
                            className="mt-5 h-[52px] w-full rounded-[22px] px-6 text-base font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.28)] transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-[#155aa6]/20 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            {isSubmitting ? 'در حال ارسال…' : 'ارسال پیام'}
                        </button>
                    </div>
                </main>
            )}
        </div>
    );
}
