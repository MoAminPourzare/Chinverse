'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Headphones, Send } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Surface from '@/components/ui/Surface';
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
            <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
                <PageHeader title="پشتیبانی" subtitle="پیام شما ثبت شد" onBack={handleClose} />
                <main className="mx-auto mt-5 w-full max-w-2xl">
                    <EmptyState
                        icon={<CheckCircle2 size={32} />}
                        title="پیامت به دست ما رسید"
                        description="تیم پشتیبانی چین‌ورس پیام را بررسی می‌کند و در اولین فرصت پاسخ می‌دهد."
                        action={<PrimaryButton onClick={handleClose}>بازگشت</PrimaryButton>}
                    />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-full px-4 pb-8 pt-4" dir="rtl">
            <PageHeader title="پشتیبانی" subtitle="سوال یا مشکل خودت را برای ما بفرست" onBack={handleClose} />

            <main className="mx-auto mt-5 grid w-full max-w-5xl gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <Surface className="bg-slate-950 p-6 text-white">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/10 text-amber-200">
                        <Headphones size={28} />
                    </div>
                    <h1 className="mt-5 text-2xl font-black tracking-tight">چطور می‌توانیم کمک کنیم؟</h1>
                    <p className="mt-3 text-sm leading-8 text-white/70">
                        پیام کوتاه، واضح و همراه با جزئیات بنویس تا سریع‌تر بتوانیم مشکل را پیدا کنیم.
                    </p>
                </Surface>

                <Surface className="p-4 sm:p-5">
                    <label htmlFor="support-message" className="text-sm font-bold text-slate-900">
                        متن پیام
                    </label>
                    <textarea
                        id="support-message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="پیامت را اینجا بنویس..."
                        className="mt-3 min-h-48 w-full resize-none rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                        rows={7}
                    />
                    <PrimaryButton
                        onClick={handleSubmit}
                        disabled={!message.trim() || isSubmitting}
                        className="mt-4 w-full"
                        leadingIcon={isSubmitting ? undefined : <Send size={18} />}
                    >
                        {isSubmitting ? 'در حال ارسال...' : 'ارسال پیام'}
                    </PrimaryButton>
                </Surface>
            </main>
        </div>
    );
}
