'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Clock3, Loader2, MessageSquareText, RefreshCw, X } from 'lucide-react';
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
            <header className="grid grid-cols-[44px_1fr_44px] items-center" dir="ltr">
                <IconButton onClick={closeSupport} label="بستن" className="justify-self-end">
                    <X size={20} />
                </IconButton>
                <div className="flex justify-center">
                    <Image src="/assets/chinverse/logos/chinverse-wordmark.png" alt="چین‌ورس" width={602} height={250} className="h-auto w-[116px] object-contain" priority />
                </div>
                <span aria-hidden />
            </header>

            {screen === 'success' ? (
                <main className="flex flex-1 flex-col items-center px-2 pt-[clamp(56px,18dvh,140px)] text-right">
                    <Image src="/assets/chinverse/icons/Support & Help.svg" alt="پشتیبان چین‌ورس" width={192} height={192} loading="eager" className="h-[170px] w-[170px] object-contain" />
                    <div role="status" className="mt-6 w-full max-w-[310px] text-[12px] font-medium leading-6 text-[#40464f] dark:text-slate-300">
                        <h1 className="font-semibold text-slate-800 dark:text-slate-100">پیامت به دست ما رسید!</h1>
                        <p className="mt-1">تیم پشتیبانی چین‌ورس بزودی بررسیش می‌کنه و پاسخ می‌ده. ممنون که با ما در ارتباط هستی.</p>
                    </div>
                    <button type="button" onClick={() => setScreen('input')} className="mt-7 min-h-12 rounded-2xl border border-[#d5e1ef] bg-white px-6 text-sm font-bold text-[#155aa6] transition hover:bg-blue-50 dark:bg-[#202936] dark:text-[#a8d2ff]">
                        مشاهده درخواست‌ها
                    </button>
                </main>
            ) : (
                <main className="flex flex-1 flex-col">
                    <section className="mt-6 text-right">
                        <Image src="/assets/chinverse/icons/Support & Help.svg" alt="پشتیبان چین‌ورس" width={144} height={144} loading="eager" className="mx-auto mb-5 h-36 w-36 object-contain" />
                        <h1 className="text-xl font-black text-slate-900">پشتیبانی چین‌ورس</h1>
                        <p className="mt-2 text-[13px] font-medium leading-7 text-slate-600">سوال یا مشکلت رو اینجا بنویس؛ تیم پشتیبانی چین‌ورس بهت پاسخ می‌ده.</p>
                    </section>

                    <div className="mt-6">
                        <textarea value={message} onChange={(event) => { setMessage(event.target.value); if (error) setError(''); }} placeholder="پیامت رو اینجا بنویس…" rows={4} maxLength={4000} aria-label="پیام پشتیبانی" dir="rtl" className="min-h-28 w-full resize-none rounded-2xl border border-[#155aa6] bg-white px-4 py-3 text-justify text-[13px] leading-7 text-slate-800 outline-none placeholder:text-right focus:ring-4 focus:ring-[#155aa6]/10" />
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
