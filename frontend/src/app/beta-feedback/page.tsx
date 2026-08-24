'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, MessageSquarePlus, X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useSafeBack } from '@/hooks/useSafeBack';
import { authService } from '@/services/auth.service';
import {
    betaService,
    collectBetaClientMetadata,
    type BetaFeedbackKind,
} from '@/services/beta.service';
import { validateTextLength, validationMessage } from '@/validation';

const kinds: Array<{ value: BetaFeedbackKind; label: string }> = [
    { value: 'feedback', label: 'بازخورد کلی' },
    { value: 'bug', label: 'گزارش خطا' },
    { value: 'feature_request', label: 'پیشنهاد قابلیت' },
    { value: 'other', label: 'سایر' },
];

export default function BetaFeedbackPage() {
    const close = useSafeBack('/');
    const [isReady, setIsReady] = useState(false);
    const [isEligible, setIsEligible] = useState(false);
    const [consentRequired, setConsentRequired] = useState(false);
    const [consentVersion, setConsentVersion] = useState('');
    const [consentChecked, setConsentChecked] = useState(false);
    const [isAcceptingConsent, setIsAcceptingConsent] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [kind, setKind] = useState<BetaFeedbackKind>('feedback');
    const [rating, setRating] = useState<number | undefined>();
    const [message, setMessage] = useState('');
    const [steps, setSteps] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            if (!await authService.restoreSession()) {
                if (!cancelled) window.location.assign('/login?next=/beta-feedback');
                return;
            }
            try {
                const status = await betaService.getStatus();
                if (!cancelled) {
                    setIsEligible(status.eligible);
                    setConsentRequired(status.consent_required && status.eligible);
                    setConsentVersion(status.consent_version);
                    setIsReady(true);
                }
            } catch {
                if (!cancelled) {
                    setIsEligible(false);
                    setIsReady(true);
                }
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const submitLabel = useMemo(() => isSubmitting ? 'در حال ثبت…' : 'ثبت بازخورد', [isSubmitting]);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = message.trim();
        const validationError = validationMessage(
            validateTextLength(trimmed, 'پیام بازخورد', { required: true, min: 10, max: 4000 }),
        );
        setError(validationError);
        if (validationError || isSubmitting || !isEligible) return;

        setIsSubmitting(true);
        try {
            await betaService.submitFeedback({
                kind,
                rating,
                message: trimmed,
                steps_to_reproduce: steps.trim() || undefined,
                route: typeof window === 'undefined' ? undefined : window.location.pathname,
                client_metadata: collectBetaClientMetadata(),
            });
            setSubmitted(true);
            setMessage('');
            setSteps('');
        } catch {
            setError('ثبت بازخورد انجام نشد. لطفاً کمی بعد دوباره تلاش کن.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const redeemInvite = async () => {
        const code = inviteCode.trim();
        if (code.length < 16 || isRedeeming) return;
        setError('');
        setIsRedeeming(true);
        try {
            const status = await betaService.redeemInvite(code);
            setIsEligible(status.eligible);
            setConsentRequired(status.consent_required && status.eligible);
            setConsentVersion(status.consent_version);
            setInviteCode('');
            if (!status.eligible) {
                setError('این دعوت‌نامه برای این حساب فعال نشد.');
            }
        } catch {
            setError('دعوت‌نامه معتبر نیست یا منقضی شده است.');
        } finally {
            setIsRedeeming(false);
        }
    };

    const acceptConsent = async () => {
        if (!consentChecked || !consentVersion || isAcceptingConsent) return;
        setError('');
        setIsAcceptingConsent(true);
        try {
            const status = await betaService.acceptConsent(consentVersion);
            setIsEligible(status.feedback_enabled && status.eligible);
            setConsentRequired(status.consent_required && status.eligible);
            setConsentChecked(false);
        } catch {
            setError('ثبت رضایت انجام نشد. لطفاً دوباره تلاش کن.');
        } finally {
            setIsAcceptingConsent(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col bg-[#f7f8fa] px-5 pb-8 pt-5 dark:bg-[#10151c]" dir="rtl">
            <header className="grid grid-cols-[44px_1fr_44px] items-center">
                <IconButton onClick={close} label="بستن"><X size={20} /></IconButton>
                <h1 className="text-center text-lg font-black text-slate-900 dark:text-white">بازخورد بتای چین‌ورس</h1>
                <span aria-hidden />
            </header>

            {!isReady ? (
                <main className="flex flex-1 items-center justify-center" aria-live="polite">
                    <Loader2 className="animate-spin text-[#155aa6]" aria-label="در حال بارگذاری" />
                </main>
            ) : !isEligible ? (
                <main className="mx-auto flex max-w-[380px] flex-1 flex-col items-center justify-center text-center">
                    <MessageSquarePlus size={42} className="text-slate-300" aria-hidden />
                    <h2 className="mt-5 text-lg font-black text-slate-900 dark:text-white">بتای بسته برای این حساب فعال نیست</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">اگر دعوت‌نامه داری، ابتدا آن را از پشتیبانی پیگیری کن.</p>
                    <label className="mt-6 w-full text-right text-sm font-black text-slate-800 dark:text-slate-100">
                        کد دعوت بتا
                        <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} minLength={16} maxLength={80} dir="ltr" autoComplete="one-time-code" placeholder="کد دعوت را وارد کن" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm outline-none focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                    </label>
                    {error && <p role="alert" className="mt-3 w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-right text-sm font-bold leading-6 text-rose-600">{error}</p>}
                    <button type="button" onClick={redeemInvite} disabled={inviteCode.trim().length < 16 || isRedeeming} className="mt-4 h-12 w-full rounded-2xl bg-[#155aa6] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-55">{isRedeeming ? 'در حال بررسی…' : 'فعال‌سازی دعوت‌نامه'}</button>
                </main>
            ) : consentRequired ? (
                <main className="mx-auto flex max-w-[390px] flex-1 flex-col justify-center">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">رضایت‌نامه‌ی بتا</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">برای ارسال بازخورد، نسخه‌ی فعلی رضایت‌نامه‌ی بتا را بخوان و تأیید کن. این رضایت قابل ثبت و پیگیری است.</p>
                    <Link href="/legal/terms" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#155aa6]/30 px-4 text-sm font-black text-[#155aa6]">مشاهده شرایط استفاده</Link>
                    <label className="mt-5 flex min-h-11 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold leading-6 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                        <input type="checkbox" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} className="mt-1 h-5 w-5 accent-[#155aa6]" />
                        <span>نسخه‌ی <b dir="ltr">{consentVersion}</b> را خواندم و با شرکت در بتای محدود و ارسال بازخورد موافقم.</span>
                    </label>
                    {error && <p role="alert" className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-600">{error}</p>}
                    <button type="button" onClick={acceptConsent} disabled={!consentChecked || isAcceptingConsent} className="mt-5 h-12 w-full rounded-2xl bg-[#155aa6] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-55">{isAcceptingConsent ? 'در حال ثبت…' : 'پذیرش و ادامه'}</button>
                </main>
            ) : submitted ? (
                <main className="flex flex-1 flex-col items-center justify-center text-center">
                    <CheckCircle2 size={58} className="text-emerald-500" aria-hidden />
                    <h2 className="mt-5 text-xl font-black text-slate-900 dark:text-white">بازخوردت ثبت شد</h2>
                    <p className="mt-3 max-w-[290px] text-sm leading-7 text-slate-500 dark:text-slate-300">از زمانی که برای بهترشدن بتا گذاشتی ممنونیم.</p>
                    <button type="button" onClick={() => setSubmitted(false)} className="mt-7 h-12 w-full max-w-[280px] rounded-2xl bg-[#155aa6] px-5 text-sm font-black text-white">ثبت بازخورد دیگر</button>
                </main>
            ) : (
                <form onSubmit={submit} className="mx-auto mt-8 w-full max-w-[430px] space-y-5">
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">بازخورد با حساب داخلی برای پیگیری ثبت می‌شود؛ اطلاعات تماس یا محتوای خصوصی در گزارش عمومی نمایش داده نمی‌شود.</p>
                    <label className="block text-sm font-black text-slate-800 dark:text-slate-100">
                        نوع بازخورد
                        <select value={kind} onChange={(event) => setKind(event.target.value as BetaFeedbackKind)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                            {kinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                    </label>
                    <fieldset>
                        <legend className="text-sm font-black text-slate-800 dark:text-slate-100">امتیاز تجربه (اختیاری)</legend>
                        <div className="mt-2 grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button key={value} type="button" onClick={() => setRating(value)} aria-pressed={rating === value} className={`h-11 rounded-xl border text-sm font-black transition ${rating === value ? 'border-[#155aa6] bg-[#155aa6] text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'}`}>
                                    {value}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    <label className="block text-sm font-black text-slate-800 dark:text-slate-100">
                        پیام
                        <textarea value={message} onChange={(event) => { setMessage(event.target.value); if (error) setError(''); }} rows={5} maxLength={4000} required placeholder="چه چیزی خوب بود یا چه چیزی مشکل داشت؟" className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                    </label>
                    <label className="block text-sm font-black text-slate-800 dark:text-slate-100">
                        مراحل تکرار (برای گزارش خطا، اختیاری)
                        <textarea value={steps} onChange={(event) => setSteps(event.target.value)} rows={3} maxLength={2000} placeholder="۱) … ۲) …" className="mt-2 min-h-20 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-[#155aa6] focus:ring-4 focus:ring-[#155aa6]/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                    </label>
                    {error && <p role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-600">{error}</p>}
                    <button type="submit" disabled={isSubmitting || !message.trim()} className="h-[52px] w-full rounded-2xl bg-[#155aa6] px-6 text-base font-black text-white shadow-[0_8px_16px_rgba(21,90,166,0.26)] disabled:cursor-not-allowed disabled:opacity-55">{submitLabel}</button>
                </form>
            )}
        </div>
    );
}
