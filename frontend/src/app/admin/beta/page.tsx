'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCopy,
    FlaskConical,
    Loader2,
    RefreshCw,
    Send,
    UserPlus,
} from 'lucide-react';
import { AppHeader } from '@/components/ui/IconButton';
import {
    adminService,
    type AdminBetaFeedback,
    type AdminBetaFeedbackStatus,
    type AdminBetaInvite,
    type AdminBetaSeverity,
    type AdminBetaSummary,
} from '@/lib/admin';
import { authService } from '@/services/auth.service';

type FeedbackDraft = {
    status: AdminBetaFeedbackStatus;
    severity: AdminBetaSeverity;
    note: string;
};

const feedbackFilters: Array<{ value: AdminBetaFeedbackStatus | 'all'; label: string }> = [
    { value: 'open', label: 'باز' },
    { value: 'triaged', label: 'بررسی‌شده' },
    { value: 'resolved', label: 'حل‌شده' },
    { value: 'dismissed', label: 'ردشده' },
    { value: 'all', label: 'همه' },
];

const statusLabels: Record<AdminBetaFeedbackStatus, string> = {
    open: 'باز',
    triaged: 'بررسی‌شده',
    resolved: 'حل‌شده',
    dismissed: 'ردشده',
};

const inviteStatusLabels: Record<AdminBetaInvite['status'], string> = {
    issued: 'صادرشده',
    redeemed: 'استفاده‌شده',
    revoked: 'لغوشده',
    expired: 'منقضی',
};

const severityOptions: AdminBetaSeverity[] = ['unclassified', 'P0', 'P1', 'P2', 'P3'];

function formatDate(value: string | null) {
    if (!value) return '—';
    return new Date(value).toLocaleString('fa-IR');
}

function apiMessage(caught: unknown, fallback: string) {
    const error = caught as { response?: { data?: { detail?: string } } };
    return error.response?.data?.detail || fallback;
}

export default function AdminBetaPage() {
    const router = useRouter();
    const [summary, setSummary] = useState<AdminBetaSummary | null>(null);
    const [invites, setInvites] = useState<AdminBetaInvite[]>([]);
    const [feedback, setFeedback] = useState<AdminBetaFeedback[]>([]);
    const [drafts, setDrafts] = useState<Record<number, FeedbackDraft>>({});
    const [filter, setFilter] = useState<AdminBetaFeedbackStatus | 'all'>('open');
    const [email, setEmail] = useState('');
    const [ttlDays, setTtlDays] = useState('14');
    const [issuedCode, setIssuedCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [needsMfa, setNeedsMfa] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (!await authService.restoreSession()) {
                router.replace('/login?next=/admin/beta');
                return;
            }
            const access = await adminService.getAdminAccess();
            if (!access.is_admin) {
                setError('این حساب دسترسی مدیر ندارد.');
                return;
            }
            if (!access.mfa_enabled || !access.mfa_verified) {
                setNeedsMfa(true);
                setError('برای مدیریت بتا، ورود دومرحله‌ای مدیر لازم است.');
                return;
            }
            setNeedsMfa(false);
            const [loadedSummary, loadedInvites, loadedFeedback] = await Promise.all([
                adminService.getBetaSummary(),
                adminService.listBetaInvites(),
                adminService.listBetaFeedback(filter === 'all' ? undefined : filter),
            ]);
            setSummary(loadedSummary);
            setInvites(loadedInvites);
            setFeedback(loadedFeedback);
            setDrafts(Object.fromEntries(loadedFeedback.map((item) => [item.id, {
                status: item.status,
                severity: item.severity,
                note: item.triage_note ?? '',
            }])));
        } catch (caught) {
            setError(apiMessage(caught, 'اطلاعات بتا بارگذاری نشد.'));
        } finally {
            setLoading(false);
        }
    }, [filter, router]);

    useEffect(() => { void loadData(); }, [loadData]);

    const issueInvite = async () => {
        const ttl = Number(ttlDays);
        if (!Number.isInteger(ttl) || ttl < 1 || ttl > 90) {
            setError('اعتبار دعوت باید بین ۱ تا ۹۰ روز باشد.');
            return;
        }
        setPending('issue');
        setError('');
        setMessage('');
        setIssuedCode('');
        try {
            const result = await adminService.issueBetaInvite({
                ...(email.trim() ? { email: email.trim() } : {}),
                ttl_days: ttl,
            });
            setIssuedCode(result.code);
            setEmail('');
            setMessage('دعوت صادر شد. کد فقط همین یک بار نمایش داده می‌شود.');
            setInvites(await adminService.listBetaInvites());
            setSummary(await adminService.getBetaSummary());
        } catch (caught) {
            setError(apiMessage(caught, 'صدور دعوت انجام نشد.'));
        } finally {
            setPending('');
        }
    };

    const revokeInvite = async (inviteId: number) => {
        if (!window.confirm('این دعوت لغو شود؟ پس از لغو قابل استفاده نیست.')) return;
        setPending(`invite:${inviteId}`);
        setError('');
        try {
            await adminService.revokeBetaInvite(inviteId);
            setMessage('دعوت لغو شد.');
            await loadData();
        } catch (caught) {
            setError(apiMessage(caught, 'لغو دعوت انجام نشد.'));
        } finally {
            setPending('');
        }
    };

    const saveFeedback = async (item: AdminBetaFeedback) => {
        const draft = drafts[item.id] ?? {
            status: item.status,
            severity: item.severity,
            note: item.triage_note ?? '',
        };
        if (draft.severity === 'unclassified' && draft.status !== 'open') {
            setError('برای feedback بررسی‌شده ابتدا severity را مشخص کن.');
            return;
        }
        setPending(`feedback:${item.id}`);
        setError('');
        setMessage('');
        try {
            const updated = await adminService.updateBetaFeedback(item.id, {
                status: draft.status,
                severity: draft.severity,
                triage_note: draft.note.trim() || undefined,
            });
            if (filter !== 'all' && updated.status !== filter) {
                setFeedback((items) => items.filter((current) => current.id !== item.id));
            } else {
                setFeedback((items) => items.map((current) => current.id === updated.id ? updated : current));
            }
            setSummary(await adminService.getBetaSummary());
            setMessage('triage بازخورد ثبت شد.');
        } catch (caught) {
            setError(apiMessage(caught, 'ثبت triage انجام نشد.'));
        } finally {
            setPending('');
        }
    };

    return (
        <main className="min-h-full bg-[#f7f8fb] px-4 pb-12 pt-4" dir="rtl">
            <AppHeader title="عملیات بتای بسته" backHref="/admin" icon={<FlaskConical size={22} />} />
            <div className="mx-auto mt-6 w-full max-w-4xl space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold leading-6 text-slate-500">فقط staging؛ بدون نمایش کد خام یا اطلاعات تماس در گزارش‌ها</p>
                    <button type="button" onClick={loadData} disabled={loading} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-slate-600 shadow-sm disabled:opacity-50">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> تازه‌سازی
                    </button>
                </div>

                {message && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
                {error && (
                    <div role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold leading-7 text-rose-700">
                        {error}
                        {needsMfa && <Link href="/account/security" className="mr-2 underline">امنیت حساب</Link>}
                    </div>
                )}

                {loading ? (
                    <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-[#155aa6]" /></div>
                ) : summary && (
                    <>
                        {!summary.enabled && (
                            <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
                                <AlertTriangle className="mt-1 shrink-0" size={20} />
                                بتا در backend خاموش است. پیش از صدور دعوت، secret و feature flagهای staging را طبق گزارش مرحلهٔ ۵ تنظیم کن.
                            </div>
                        )}

                        <section aria-labelledby="beta-summary-title" className="rounded-3xl bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.07)]">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 id="beta-summary-title" className="font-black text-slate-900">گزارش روزانه</h2>
                                    <p className="mt-1 text-xs text-slate-400" dir="ltr">SHA {summary.release_sha}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${summary.open_p0_p1_count ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    P0/P1 باز: {summary.open_p0_p1_count.toLocaleString('fa-IR')}
                                </span>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {[
                                    ['دعوت', summary.invite_total],
                                    ['رضایت', summary.consent_count],
                                    ['بازخورد', summary.feedback_total],
                                    ['باز', summary.open_feedback_count],
                                ].map(([label, value]) => (
                                    <div key={String(label)} className="rounded-2xl bg-slate-50 p-4 text-center">
                                        <p className="text-xl font-black text-slate-900">{Number(value).toLocaleString('fa-IR')}</p>
                                        <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section aria-labelledby="invite-title" className="rounded-3xl bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.07)]">
                            <h2 id="invite-title" className="flex items-center gap-2 font-black text-slate-900"><UserPlus size={19} /> صدور دعوت</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px_auto]">
                                <label className="text-xs font-black text-slate-600">ایمیل تستر (اختیاری)
                                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" placeholder="tester@example.com" dir="ltr" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-left text-sm outline-none focus:border-[#155aa6]" />
                                </label>
                                <label className="text-xs font-black text-slate-600">اعتبار (روز)
                                    <input type="number" min={1} max={90} value={ttlDays} onChange={(event) => setTtlDays(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-[#155aa6]" />
                                </label>
                                <button type="button" onClick={issueInvite} disabled={pending === 'issue' || !summary.enabled} className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-5 text-sm font-black text-white disabled:opacity-50">
                                    {pending === 'issue' ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />} صدور
                                </button>
                            </div>
                            {issuedCode && (
                                <div role="status" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                    <p className="text-xs font-black text-emerald-800">کد یک‌بارمصرف دعوت</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-white px-3 py-3 text-left text-sm font-black text-slate-900" dir="ltr">{issuedCode}</code>
                                        <button type="button" aria-label="کپی کد دعوت" onClick={() => navigator.clipboard.writeText(issuedCode)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><ClipboardCopy size={18} /></button>
                                    </div>
                                </div>
                            )}
                            <div className="mt-5 space-y-2">
                                {invites.length === 0 ? <p className="text-sm font-bold text-slate-400">هنوز دعوتی ثبت نشده است.</p> : invites.map((invite) => (
                                    <div key={invite.invite_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-xs">
                                        <div>
                                            <p className="font-black text-slate-700">دعوت #{invite.invite_id.toLocaleString('fa-IR')} · {inviteStatusLabels[invite.status]}</p>
                                            <p className="mt-1 text-slate-400">انقضا: {formatDate(invite.expires_at)} · {invite.has_email_binding ? 'متصل به ایمیل' : 'بدون اتصال ایمیل'}</p>
                                        </div>
                                        {(invite.status === 'issued' || invite.status === 'redeemed') && (
                                            <button type="button" onClick={() => revokeInvite(invite.invite_id)} disabled={pending === `invite:${invite.invite_id}`} className="min-h-11 rounded-xl border border-rose-200 px-4 font-black text-rose-600 disabled:opacity-50">لغو</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section aria-labelledby="feedback-title" className="rounded-3xl bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.07)]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 id="feedback-title" className="font-black text-slate-900">صف triage بازخورد</h2>
                                <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                                    {feedbackFilters.map((item) => (
                                        <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`min-h-11 rounded-lg px-3 text-xs font-black ${filter === item.value ? 'bg-white text-[#155aa6] shadow-sm' : 'text-slate-500'}`}>{item.label}</button>
                                    ))}
                                </div>
                            </div>
                            {feedback.length === 0 ? (
                                <div className="mt-5 flex h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm font-bold text-slate-400"><CheckCircle2 className="mb-2 text-emerald-500" />بازخوردی در این وضعیت نیست.</div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    {feedback.map((item) => {
                                        const draft = drafts[item.id] ?? { status: item.status, severity: item.severity, note: item.triage_note ?? '' };
                                        return (
                                            <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-xs font-black text-slate-600">#{item.id.toLocaleString('fa-IR')} · {item.kind} · {formatDate(item.created_at)}</p>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{statusLabels[item.status]}</span>
                                                </div>
                                                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.message}</p>
                                                {item.steps_to_reproduce && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">گام‌ها: {item.steps_to_reproduce}</p>}
                                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                    <label className="text-xs font-black text-slate-600">Severity
                                                        <select value={draft.severity} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, severity: event.target.value as AdminBetaSeverity } }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                                                            {severityOptions.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
                                                        </select>
                                                    </label>
                                                    <label className="text-xs font-black text-slate-600">وضعیت
                                                        <select value={draft.status} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, status: event.target.value as AdminBetaFeedbackStatus } }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                                                            {feedbackFilters.filter((entry) => entry.value !== 'all').map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
                                                        </select>
                                                    </label>
                                                </div>
                                                <label className="mt-3 block text-xs font-black text-slate-600">یادداشت triage
                                                    <textarea value={draft.note} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, note: event.target.value } }))} rows={3} maxLength={4000} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6" />
                                                </label>
                                                <button type="button" onClick={() => saveFeedback(item)} disabled={pending === `feedback:${item.id}`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#155aa6] px-4 text-sm font-black text-white disabled:opacity-50">
                                                    {pending === `feedback:${item.id}` ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} ثبت triage
                                                </button>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
