'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, MessageSquareText, RefreshCw, X } from 'lucide-react';
import { communityService, type SupportTicket } from '@/services/community.service';
import { authService } from '@/services/auth.service';
import { IconButton } from '@/components/ui/IconButton';
import { useSafeBack } from '@/hooks/useSafeBack';
import { validateTextLength, validationMessage } from '@/validation';

type Screen = 'input' | 'success';

const statusLabel: Record<SupportTicket['status'], string> = {
    open: 'در انتظار بررسی',
    in_progress: 'در حال بررسی',
    closed: 'پاسخ‌داده‌شده',
};

export default function SupportPage() {
    const router = useRouter();
    const closeSupport = useSafeBack("/");
    const [screen, setScreen] = useState<Screen>('input');
    const [message, setMessage] = useState('');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');

    const loadTickets = useCallback(async () => {
        setLoadError('');
        setIsLoading(true);
        try {
            setTickets(await communityService.getSupportTickets());
        } catch {
            setLoadError('دریافت درخواست‌های قبلی انجام نشد. دوباره تلاش کن.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            if (!await authService.restoreSession()) {
                if (!cancelled) router.replace('/login?next=/support');
                return;
            }
            if (!cancelled) await loadTickets();
        })();
        return () => { cancelled = true; };
    }, [loadTickets, router]);

    const handleSubmit = async () => {
        const trimmed = message.trim();
        const validationError = validationMessage(
            validateTextLength(trimmed, 'پیام پشتیبانی', { required: true, min: 10, max: 4000 })
        );
        setError(validationError);
        if (validationError || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await communityService.submitSupportTicket({ message: trimmed });
            setScreen('success');
            setMessage('');
            await loadTickets();
        } catch {
            setError('ارسال پیام انجام نشد. لطفاً کمی بعد دوباره تلاش کن.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col bg-[#f7f8fa] px-5 pb-8 pt-5" dir="rtl">
            <header className="grid grid-cols-[44px_1fr_44px] items-center">
                <IconButton onClick={closeSupport} label="بستن" className="justify-self-end">
                    <X size={20} />
                </IconButton>
                <div className="flex justify-center">
                    <Image src="/assets/chinverse/logos/chinverse-logo.png" alt="چین‌ورس" width={116} height={36} className="h-auto w-[116px] object-contain" priority />
                </div>
                <span aria-hidden />
            </header>

            {screen === 'success' ? (
                <main className="flex flex-1 flex-col items-center justify-center text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#155aa6]/10 text-[#155aa6]">
                        <CheckCircle2 size={48} strokeWidth={1.8} />
                    </div>
                    <h1 className="mt-7 text-xl font-black text-slate-900">پیامت ثبت شد</h1>
                    <p className="mt-3 max-w-[290px] text-sm leading-7 text-slate-500">وضعیت درخواست و پاسخ تیم پشتیبانی را همین‌جا می‌بینی.</p>
                    <button type="button" onClick={() => setScreen('input')} className="mt-8 h-[52px] w-full max-w-[295px] rounded-[22px] bg-[#155aa6] px-6 text-base font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.26)]">
                        مشاهده درخواست‌ها
                    </button>
                </main>
            ) : (
                <main className="flex flex-1 flex-col">
                    <section className="mt-10 text-right">
                        <h1 className="text-xl font-black text-slate-900">پشتیبانی چین‌ورس</h1>
                        <p className="mt-2 text-[13px] font-medium leading-7 text-slate-600">سؤال یا مشکلت را بنویس؛ پاسخ تیم پشتیبانی در همین صفحه و اعلان‌ها نمایش داده می‌شود.</p>
                    </section>

                    <div className="mt-6">
                        <textarea value={message} onChange={(event) => { setMessage(event.target.value); if (error) setError(''); }} placeholder="پیامت را اینجا بنویس" rows={4} maxLength={4000} aria-label="پیام پشتیبانی" className="min-h-28 w-full resize-none rounded-2xl border border-[#155aa6] bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none focus:ring-4 focus:ring-[#155aa6]/10" />
                        {error && <p role="alert" className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-600">{error}</p>}
                        <button type="button" onClick={handleSubmit} disabled={!message.trim() || isSubmitting} className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[22px] bg-[#155aa6] px-6 text-base font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.28)] disabled:cursor-not-allowed disabled:opacity-55">
                            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                            {isSubmitting ? 'در حال ارسال…' : 'ارسال پیام'}
                        </button>
                    </div>

                    <section className="mt-8" aria-labelledby="support-history-title">
                        <div className="flex items-center justify-between">
                            <h2 id="support-history-title" className="text-base font-black text-slate-900">درخواست‌های من</h2>
                            {!isLoading && <IconButton onClick={loadTickets} label="به‌روزرسانی درخواست‌ها"><RefreshCw size={18} /></IconButton>}
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="animate-spin" /></div>
                        ) : loadError ? (
                            <button type="button" onClick={loadTickets} className="mt-4 w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm font-bold text-rose-700">{loadError}</button>
                        ) : tickets.length === 0 ? (
                            <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-slate-400">
                                <MessageSquareText size={30} />
                                <p className="mt-3 text-sm font-bold">هنوز درخواستی ثبت نکرده‌ای.</p>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {tickets.map((ticket) => (
                                    <article key={ticket.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600"><Clock3 size={13} />{statusLabel[ticket.status]}</span>
                                            <time className="text-[11px] text-slate-400">{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</time>
                                        </div>
                                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{ticket.message}</p>
                                        {ticket.admin_reply && (
                                            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                                                <p className="text-xs font-black text-[#155aa6]">پاسخ پشتیبانی</p>
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{ticket.admin_reply}</p>
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            )}
        </div>
    );
}
