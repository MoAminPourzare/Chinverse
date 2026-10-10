'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Headphones, Loader2, RefreshCw, Send } from 'lucide-react';
import { AppHeader } from '@/components/ui/IconButton';
import { adminService, type AdminSupportTicket } from '@/lib/admin';
import { authService } from '@/services/auth.service';

type TicketStatus = AdminSupportTicket['status'];

const filters: Array<{ value: TicketStatus | 'all'; label: string }> = [
    { value: 'all', label: 'همه' },
    { value: 'open', label: 'باز' },
    { value: 'in_progress', label: 'در حال بررسی' },
    { value: 'closed', label: 'بسته' },
];

const statusLabel: Record<TicketStatus, string> = {
    open: 'باز',
    in_progress: 'در حال بررسی',
    closed: 'بسته',
};

export default function AdminSupportPage() {
    const router = useRouter();
    const [filter, setFilter] = useState<TicketStatus | 'all'>('open');
    const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
    const [drafts, setDrafts] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [needsMfa, setNeedsMfa] = useState(false);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (!await authService.restoreSession()) {
                router.replace('/login?next=/admin/support');
                return;
            }
            const access = await adminService.getAdminAccess();
            if (!access.is_admin) {
                setError('این حساب دسترسی مدیر ندارد.');
                return;
            }
            if (!access.mfa_enabled || !access.mfa_verified) {
                setNeedsMfa(true);
                setError('برای مدیریت تیکت‌ها، ورود دومرحله‌ای مدیر لازم است.');
                return;
            }
            setNeedsMfa(false);
            setTickets(await adminService.listSupportTickets(filter === 'all' ? undefined : filter));
        } catch {
            setError('تیکت‌های پشتیبانی بارگذاری نشدند.');
        } finally {
            setLoading(false);
        }
    }, [filter, router]);

    useEffect(() => { void loadTickets(); }, [loadTickets]);

    const updateTicket = async (ticket: AdminSupportTicket, status: TicketStatus) => {
        const reply = (drafts[ticket.id] ?? ticket.admin_reply ?? '').trim();
        if (status === 'closed' && !reply) {
            setError('پیش از بستن تیکت باید پاسخ ثبت شود.');
            return;
        }
        setPending(ticket.id);
        setError('');
        setMessage('');
        try {
            const updated = await adminService.updateSupportTicket(ticket.id, {
                status,
                ...(reply && reply !== ticket.admin_reply ? { reply } : {}),
            });
            if (filter !== 'all' && updated.status !== filter) {
                setTickets((items) => items.filter((item) => item.id !== ticket.id));
            } else {
                setTickets((items) => items.map((item) => item.id === updated.id ? updated : item));
            }
            setMessage(status === 'closed' ? 'پاسخ ارسال و تیکت بسته شد.' : 'وضعیت تیکت به‌روز شد.');
        } catch (caught: unknown) {
            const apiError = caught as { response?: { data?: { detail?: string } } };
            setError(apiError.response?.data?.detail || 'ثبت پاسخ انجام نشد.');
        } finally {
            setPending(null);
        }
    };

    return (
        <main className="min-h-full bg-[#f7f8fb] px-4 pb-12 pt-4" dir="rtl">
            <AppHeader title="تیکت‌های پشتیبانی" backHref="/admin" icon={<Headphones size={22} />} />
            <div className="mx-auto mt-6 w-full max-w-3xl">
                <div className="flex gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1">
                    {filters.map((item) => (
                        <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`min-h-11 flex-1 whitespace-nowrap rounded-xl px-3 text-xs font-black transition ${filter === item.value ? 'bg-white text-[#155aa6] shadow-sm' : 'text-slate-500'}`}>
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <button type="button" onClick={loadTickets} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-slate-600 shadow-sm disabled:opacity-50">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> تازه‌سازی
                    </button>
                </div>

                {message && <p role="status" className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
                {error && (
                    <div role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold leading-7 text-rose-700">
                        {error}
                        {needsMfa && <Link href="/account/security" className="mr-2 underline">امنیت حساب</Link>}
                    </div>
                )}

                {loading ? (
                    <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-[#155aa6]" /></div>
                ) : !error && tickets.length === 0 ? (
                    <div className="mt-5 flex h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-sm font-bold text-slate-400">
                        <CheckCircle2 size={32} className="mb-3 text-emerald-500" />
                        تیکتی در این وضعیت نیست.
                    </div>
                ) : (
                    <div className="mt-5 space-y-4">
                        {tickets.map((ticket) => (
                            <article key={ticket.id} className="rounded-3xl border border-white bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.07)]">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-black text-slate-900">{ticket.user.display_name || ticket.user.email}</h2>
                                        <p className="mt-1 text-xs text-slate-400" dir="ltr">{ticket.user.email}</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{statusLabel[ticket.status]}</span>
                                </div>
                                <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{ticket.message}</p>
                                <label className="mt-4 block text-xs font-black text-slate-600" htmlFor={`reply-${ticket.id}`}>پاسخ پشتیبانی</label>
                                <textarea id={`reply-${ticket.id}`} aria-label={`پاسخ تیکت ${ticket.id}`} value={drafts[ticket.id] ?? ticket.admin_reply ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))} rows={4} maxLength={4000} className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-[#155aa6] focus:ring-4 focus:ring-blue-100" />
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => updateTicket(ticket, 'in_progress')} disabled={pending === ticket.id} className="min-h-11 rounded-2xl bg-amber-50 px-4 text-xs font-black text-amber-700 disabled:opacity-50">در حال بررسی</button>
                                    <button type="button" onClick={() => updateTicket(ticket, 'closed')} disabled={pending === ticket.id} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#155aa6] px-4 text-sm font-black text-white disabled:opacity-50">
                                        {pending === ticket.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        ارسال پاسخ و بستن
                                    </button>
                                </div>
                                <time className="mt-4 block text-left text-[11px] text-slate-400">{new Date(ticket.created_at).toLocaleString('fa-IR')}</time>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
