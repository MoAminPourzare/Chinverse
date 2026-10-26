"use client";

import Image from "@/components/ui/PublicMediaImage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Check, ChevronLeft, Clapperboard, Clock3, Loader2, LockKeyhole, Map, Play } from "lucide-react";
import { fetchLearningPath, learningPathLessonHref, type LearningPath, type LearningPathStep } from "@/lib/learningPath";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import styles from "./LearningRoadmap.module.css";

export default function LearningRoadmap() {
    const [path, setPath] = useState<LearningPath | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async (signal?: AbortSignal, background = false) => {
        if (!background) setLoading(true);
        setError(false);
        try { const result = await fetchLearningPath(signal); if (!signal?.aborted) setPath(result); }
        catch { if (!signal?.aborted) setError(true); }
        finally { if (!signal?.aborted) setLoading(false); }
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        const refresh = () => { if (!document.hidden) void load(controller.signal, true); };
        window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
        return () => { controller.abort(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
    }, [load]);

    return <section aria-labelledby="learning-path-title" className={styles.roadmap}>
        <div className="px-5 pt-6">
            <h2 id="learning-path-title" className="flex items-center gap-2 text-xl font-black text-[#20294e] dark:text-white"><Map aria-hidden className="size-6 text-[#77859e]" />مسیر یادگیری</h2>
            <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-300">قدم‌به‌قدم پیش برو؛ با تماشای هر ویدیو، مرحلهٔ بعد باز می‌شود.</p>
            {path && path.total_count > 0 && <div className="mt-4"><p className="mb-2 text-xs font-bold text-[#155aa6] dark:text-blue-300">{path.completed_count.toLocaleString("fa-IR")} از {path.total_count.toLocaleString("fa-IR")} مرحله کامل شده</p><div role="progressbar" aria-label="پیشرفت مسیر یادگیری" aria-valuemin={0} aria-valuemax={path.total_count} aria-valuenow={path.completed_count} className="h-1.5 overflow-hidden rounded-full bg-[#e2edf6] dark:bg-slate-700"><div className="h-full rounded-full bg-[#1688e8] transition-[width]" style={{ width: `${path.completed_count / path.total_count * 100}%` }} /></div></div>}
        </div>
        {loading ? <div role="status" className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500"><Loader2 className="size-5 animate-spin" />در حال دریافت مسیر…</div>
        : error ? <div role="alert" className="p-6 text-center text-sm leading-7 text-slate-600 dark:text-slate-300"><p>مسیر یادگیری دریافت نشد.</p><button type="button" onClick={() => void load()} className="mt-3 min-h-11 rounded-xl bg-[#155aa6] px-5 font-bold text-white">تلاش دوباره</button></div>
        : !path?.steps.length ? <div className="px-6 py-10 text-center"><BookOpen aria-hidden className="mx-auto size-10 text-[#8ba6bc]" /><h3 className="mt-4 font-bold text-slate-800 dark:text-white">مسیرت به‌زودی شروع می‌شود</h3><p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">با انتشار درس‌های آموزشی، اولین مرحله اینجا قرار می‌گیرد. تا آن موقع می‌توانی مجموعه‌های کاوش را ببینی.</p><Link href="/explore" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#155aa6] px-5 text-sm font-bold text-white">رفتن به کاوش</Link></div>
        : <>{path.completed_count === path.total_count && <p role="status" className="mx-5 mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">آفرین! همهٔ مرحله‌های منتشرشده را کامل کردی. می‌توانی دوباره تماشایشان کنی.</p>}<ol className={styles.steps} aria-label="مرحله‌های مسیر یادگیری">{path.steps.map((step, index) => <RoadmapStep key={step.lesson_id} step={step} index={index} />)}</ol></>}
    </section>;
}

function RoadmapStep({ step, index }: { step: LearningPathStep; index: number }) {
    const locked = step.state === "locked", completed = step.state === "completed";
    const content = <>
        <span className={cn(styles.number, completed ? styles.completed : locked ? styles.locked : styles.current)} aria-hidden>{completed ? <Check size={19} /> : (index + 1).toLocaleString("fa-IR")}</span>
        <span className={styles.thumbnail}>{step.cover_url ? <Image src={getMediaUrl(step.cover_url)} alt="" fill sizes="88px" className="object-cover" unoptimized /> : step.kind === "explore" ? <Clapperboard aria-hidden className="size-10 text-[#7e87dd]" /> : <BookOpen aria-hidden className="size-10 text-[#6095bf]" />}<span className={styles.play} aria-hidden>{locked ? <LockKeyhole size={15} /> : completed ? <Check size={17} /> : <Play size={15} className="fill-current" />}</span></span>
        <span className="min-w-0 flex-1 text-right">
            <span className={cn("mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", step.kind === "explore" ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200" : "bg-blue-100 text-[#155aa6] dark:bg-blue-950 dark:text-blue-200")}>{step.kind === "explore" ? "کاوش · ویدیوی پیشنهادی" : step.course_title}</span>
            <span className="block break-words text-[13px] font-black leading-6 text-[#20294e] dark:text-slate-100" dir="auto">{step.title}</span>
            {step.summary && <span className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-300" dir="auto">{step.summary}</span>}
            <span className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-300"><Clock3 aria-hidden size={13} />{step.duration_minutes > 0 ? `${Math.ceil(step.duration_minutes).toLocaleString("fa-IR")} دقیقه` : "ویدیوی آموزشی"}</span>
            <span className={cn("mt-1 block text-[10px] font-bold", completed ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-300")}>{completed ? "تماشا شده · تماشای دوباره" : locked ? "پس از تماشای مرحلهٔ قبل باز می‌شود" : "نوبت این مرحله است"}</span>
        </span>
        {locked ? <LockKeyhole aria-hidden size={17} className="shrink-0 text-slate-400" /> : <ChevronLeft aria-hidden size={21} className="shrink-0 text-[#1688e8]" />}
    </>;
    const label = `مرحلهٔ ${(index + 1).toLocaleString("fa-IR")}: ${step.title}`;
    return <li className={styles.step} data-state={step.state}>{locked ? <div className={cn(styles.card, styles.lockedCard)} aria-label={`${label}، قفل است`} aria-disabled="true">{content}</div> : <Link href={learningPathLessonHref(step)} className={styles.card} aria-label={label} aria-current={step.state === "current" ? "step" : undefined}>{content}</Link>}</li>;
}
