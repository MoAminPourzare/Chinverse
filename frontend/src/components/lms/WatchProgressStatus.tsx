"use client";

import { CheckCircle2, CloudUpload, RefreshCw } from "lucide-react";

interface Props {
    percent: number;
    completed: boolean;
    saving: boolean;
    error: boolean;
    flush: (force?: boolean) => Promise<void>;
}

export default function WatchProgressStatus({ percent, completed, saving, error, flush }: Props) {
    const label = error ? "ذخیرهٔ پیشرفت انجام نشد" : saving ? "در حال ذخیرهٔ پیشرفت…" : completed ? "این مرحله کامل شد" : percent > 0 ? "پیشرفت تماشای این مرحله" : "پیشرفتت هنگام تماشا ذخیره می‌شود";
    return <div className="rounded-2xl border border-[#e0eaf4] bg-white px-3.5 py-3 dark:border-slate-700 dark:bg-[#192330]" data-watch-progress>
        <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-[#42607d] dark:text-slate-200">
            <span className="flex items-center gap-2">{completed ? <CheckCircle2 aria-hidden className="size-4 text-emerald-600" /> : <CloudUpload aria-hidden className="size-4" />}<span role={error ? "alert" : "status"}>{label}</span></span>
            <span className="shrink-0 tabular-nums">{(completed ? 100 : percent).toLocaleString("fa-IR")}٪</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e0ecf5] dark:bg-slate-700" aria-hidden><div className="h-full rounded-full bg-[#087bdb]" style={{ width: (completed ? 100 : percent) + "%" }} /></div>
        {error && <button type="button" onClick={() => void flush(true)} className="mt-2 flex min-h-11 items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300"><RefreshCw aria-hidden size={15} />ذخیرهٔ دوبارهٔ پیشرفت</button>}
    </div>;
}
