'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Volume2, X } from 'lucide-react';
import { AppHeader } from '@/components/ui/IconButton';
import { adminService } from '@/lib/admin';
import { DICTIONARY_LEVELS, dictionaryLevelLabel } from '@/lib/dictionaryLevels';
import { dictionaryAudioService, type AudioPage, type AudioState, type DictionaryRecording } from '@/lib/dictionaryAudio';
import { getMediaUrl } from '@/lib/media';
import { authService } from '@/services/auth.service';

const labels: Record<AudioState, string> = { pending: 'نیازمند بازبینی', ready: 'آمادهٔ پخش', approved: 'تأییدشده', rejected: 'ردشده' };
const reasons: Record<string, string> = { multiple_readings: 'چند تلفظ', single_character: 'تک‌نویسه', erhua: 'پایان 儿', mixed_script: 'نوشتار ترکیبی' };
const number = (value: number) => value.toLocaleString('fa-IR');
const control = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export default function DictionaryAudioPage() {
    const [allowed, setAllowed] = useState(false);
    const [accessError, setAccessError] = useState('');
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({ q: '', state: 'pending' as AudioState | 'all', level: '', multiple: false, skip: 0 });
    const [data, setData] = useState<AudioPage | null>(null);
    const [loading, setLoading] = useState(false);
    const [revision, setRevision] = useState(0);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [pending, setPending] = useState<number | null>(null);
    const [playing, setPlaying] = useState<number | null>(null);
    const [heard, setHeard] = useState<Record<number, string>>({});
    const audio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let active = true;
        async function check() {
            try {
                if (!await authService.restoreSession()) throw new Error('برای بررسی صداها، وارد حساب ادمین شو.');
                const access = await adminService.getAdminAccess();
                if (!access.is_admin) throw new Error('این حساب دسترسی ادمین ندارد.');
                if (!access.mfa_enabled || !access.mfa_verified) throw new Error('برای ورود به پنل، احراز هویت دومرحله‌ای مدیر لازم است.');
                if (active) setAllowed(true);
            } catch (caught) {
                if (active) setAccessError(caught instanceof Error ? caught.message : 'بررسی دسترسی انجام نشد.');
            }
        }
        void check();
        return () => { active = false; audio.current?.pause(); };
    }, []);

    useEffect(() => {
        if (!allowed) return;
        const controller = new AbortController();
        setLoading(true);
        setError('');
        dictionaryAudioService.list(filters, controller.signal).then((page) => {
            if (!controller.signal.aborted) setData(page);
        }).catch(() => {
            if (!controller.signal.aborted) setError('بارگذاری صداها انجام نشد. دوباره تلاش کن.');
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => { controller.abort(); audio.current?.pause(); setPlaying(null); };
    }, [allowed, filters, revision]);

    async function play(clip: DictionaryRecording) {
        audio.current?.pause();
        setPlaying(null);
        if (playing === clip.id) return;
        const player = new Audio(getMediaUrl(clip.audio_url));
        audio.current = player;
        player.onended = () => { if (audio.current === player) setPlaying(null); };
        player.onerror = () => {
            if (audio.current === player) { setPlaying(null); setError('پخش این صدا انجام نشد. اتصال را بررسی کن.'); }
        };
        setError('');
        setPlaying(clip.id);
        try { await player.play(); } catch { if (audio.current === player) { setPlaying(null); setError('پخش صدا انجام نشد. دوباره روی پخش بزن.'); } }
    }

    async function review(clip: DictionaryRecording, decision: 'approved' | 'rejected') {
        setPending(clip.id);
        setError('');
        setMessage('');
        try {
            await dictionaryAudioService.review(clip, decision, heard[clip.id] || clip.approved_pinyin || (clip.pinyins.length === 1 ? clip.pinyins[0] : undefined));
            setMessage(decision === 'approved' ? `تلفظ «${clip.chinese}» تأیید و به دیکشنری وصل شد.` : `صدای تولیدشدهٔ «${clip.chinese}» رد شد.`);
            // Keep the last page valid when its final pending item is reviewed.
            if (data?.items.length === 1 && filters.skip > 0) setFilters((f) => ({ ...f, skip: Math.max(0, f.skip - 20) }));
            else setRevision((value) => value + 1);
        } catch {
            setError('ثبت بررسی انجام نشد؛ واژه یا فایل تغییر کرده یا صدای دیگری برای واژه فعال است. صفحه را تازه‌سازی کن.');
        } finally { setPending(null); }
    }

    return (
        <main className="min-h-full bg-[#f7f8fb] px-4 pb-12 pt-4" dir="rtl">
            <AppHeader title="بازبینی صدای دیکشنری" backHref="/admin" icon={<Volume2 size={22} />} />
            <div className="mx-auto mt-5 max-w-4xl space-y-4">
                {accessError ? <div role="alert" className="rounded-2xl bg-white p-5 text-sm leading-7">{accessError}<Link href="/login?next=/admin/dictionary-audio" className="mt-3 block font-bold text-blue-700">ورود مدیر</Link></div> : !allowed ? <p role="status">در حال بررسی دسترسی…</p> : <>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-sm leading-7 text-slate-600">صدا را گوش کن و تلفظ شنیده‌شده را تأیید کن. واژه‌های حساس تا تأیید تو در دیکشنری پخش نمی‌شوند. تأیید یک تلفظ، سایر تلفظ‌های واژه را پوشش نمی‌دهد.</p>
                        {data && data.expected > data.imported && <p role="status" className="mt-3 rounded-xl bg-blue-50 p-3 text-xs leading-6 text-blue-700">در حال اتصال صداها: {number(data.imported)} از {number(data.expected)} واژه. کمی بعد تازه‌سازی کن.</p>}
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {(Object.keys(labels) as AudioState[]).map((state) => <button type="button" key={state} disabled={loading || pending !== null} onClick={() => setFilters((f) => ({ ...f, state, skip: 0 }))} aria-pressed={filters.state === state} className={`rounded-xl p-3 text-right ${filters.state === state ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-slate-50'}`}><span className="block text-xs text-slate-600">{labels[state]}</span><strong className="mt-1 block text-xl text-slate-900">{number(data?.counts[state] || 0)}</strong></button>)}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, q: query.trim(), skip: 0 })); }} className="mt-4 flex gap-2">
                            <input aria-label="جست‌وجوی واژه، پین‌یین یا معنی" placeholder="واژه، پین‌یین یا معنی" value={query} onChange={(e) => setQuery(e.target.value)} className={control} />
                            <button type="submit" disabled={loading || pending !== null} aria-label="جست‌وجو" className="min-h-11 min-w-11 rounded-xl bg-[#155aa6] text-white"><Search size={19} className="mx-auto" /></button>
                        </form>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <label className="space-y-1 text-xs text-slate-600">وضعیت<select aria-label="وضعیت" className={control} value={filters.state} disabled={pending !== null} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value as AudioState | 'all', skip: 0 }))}><option value="all">همهٔ صداها</option>{(Object.keys(labels) as AudioState[]).map((s) => <option value={s} key={s}>{labels[s]}</option>)}</select></label>
                            <label className="space-y-1 text-xs text-slate-600">سطح<select aria-label="سطح" className={control} value={filters.level} disabled={pending !== null} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value, skip: 0 }))}><option value="">همهٔ سطح‌ها</option>{DICTIONARY_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
                            <label className="flex min-h-11 items-center gap-2 self-end text-xs"><input type="checkbox" checked={filters.multiple} disabled={pending !== null} onChange={(e) => setFilters((f) => ({ ...f, multiple: e.target.checked, skip: 0 }))} />فقط واژه‌های چندتلفظی</label>
                        </div>
                    </div>
                    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">{message}</p>}
                    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-700">{error}</p>}
                    <div className="flex items-center justify-between text-xs text-slate-600"><span>{number(data?.total || 0)} نتیجه</span><button type="button" disabled={loading || pending !== null} onClick={() => setRevision((r) => r + 1)} className="flex min-h-11 items-center gap-2 px-2"><RefreshCw size={15} />تازه‌سازی</button></div>
                    {loading ? <p role="status" className="flex items-center justify-center gap-2 p-8 text-sm"><Loader2 size={18} className="animate-spin" />در حال بارگذاری…</p> : data?.items.map((clip) => <article key={clip.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-cjk text-3xl font-semibold" lang="zh-CN">{clip.chinese}</h2><p className="mt-2 font-latin text-sm text-slate-600" dir="ltr">{clip.pinyin}</p><p className="mt-2 text-sm leading-7 text-slate-600">{clip.meaning}</p></div><button type="button" onClick={() => void play(clip)} aria-label={`پخش صدای ${clip.chinese}`} aria-pressed={playing === clip.id} className={`flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl ${playing === clip.id ? 'bg-[#155aa6] text-white' : 'bg-blue-50 text-[#155aa6]'}`}><Volume2 size={23} /></button></div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600"><span className="rounded-lg bg-slate-50 px-2 py-1">{dictionaryLevelLabel(clip)}</span><span className="rounded-lg bg-blue-50 px-2 py-1">{labels[clip.status]}</span>{clip.review_reasons.map((r) => <span key={r} className="rounded-lg bg-amber-50 px-2 py-1">{reasons[r] || r}</span>)}</div>
                        {clip.stale && <p className="mt-3 text-xs leading-6 text-rose-700">پین‌یین این واژه تغییر کرده؛ صدا باید دوباره تولید شود.</p>}
                        {clip.curated_audio_preserved && <p className="mt-3 text-xs leading-6 text-slate-500">صدای قبلی واژه حفظ شده است. برای جایگزینی، ابتدا واژه را در پنل دیکشنری ویرایش کن.</p>}
                        {clip.pinyins.length > 1 && <label className="mt-3 block space-y-1 text-xs text-slate-600">کدام تلفظ را شنیدی؟<select dir="ltr" className={control} value={heard[clip.id] || clip.approved_pinyin || ''} onChange={(e) => setHeard((h) => ({ ...h, [clip.id]: e.target.value }))}><option value="">تلفظ را انتخاب کن</option>{clip.pinyins.map((p) => <option value={p} key={p}>{p}</option>)}</select></label>}
                        {clip.approved_pinyin && <p className="mt-3 text-xs text-emerald-700">تلفظ تأییدشده: <b dir="ltr" className="font-latin">{clip.approved_pinyin}</b></p>}
                        <div className="mt-4 flex gap-2"><button type="button" onClick={() => void review(clip, 'approved')} disabled={pending !== null || clip.stale || clip.curated_audio_preserved || (clip.pinyins.length > 1 && !heard[clip.id] && !clip.approved_pinyin)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#155aa6] px-3 text-xs font-bold text-white disabled:opacity-40"><Check size={16} />{pending === clip.id ? 'در حال ثبت…' : 'تأیید تلفظ'}</button><button type="button" onClick={() => void review(clip, 'rejected')} disabled={pending !== null || clip.stale} className="flex min-h-11 items-center gap-2 rounded-xl bg-rose-50 px-4 text-xs font-bold text-rose-700 disabled:opacity-40"><X size={16} />رد صدا</button></div>
                    </article>)}
                    {!loading && data?.items.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm leading-7 text-slate-500">در این فیلتر صدایی وجود ندارد.</p>}
                    <div className="flex items-center justify-between"><button type="button" disabled={loading || pending !== null || filters.skip === 0} onClick={() => setFilters((f) => ({ ...f, skip: Math.max(0, f.skip - 20) }))} className="flex min-h-11 items-center gap-1 rounded-xl bg-white px-3 text-xs disabled:opacity-40"><ChevronRight size={15} />قبلی</button><span className="text-xs text-slate-500">صفحهٔ {number(Math.floor(filters.skip / 20) + 1)}</span><button type="button" disabled={loading || pending !== null || !data || filters.skip + 20 >= data.total} onClick={() => setFilters((f) => ({ ...f, skip: f.skip + 20 }))} className="flex min-h-11 items-center gap-1 rounded-xl bg-white px-3 text-xs disabled:opacity-40">بعدی<ChevronLeft size={15} /></button></div>
                </>}
            </div>
        </main>
    );
}
