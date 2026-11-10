"use client";

import Image from "@/components/ui/PublicMediaImage";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, Clapperboard, Clock3, Loader2, LockKeyhole, Map, Play, Sparkles } from "lucide-react";
import { fetchLearningPath, fetchLearningPathCatalog, learningPathLessonHref, type LearningPath } from "@/lib/learningPath";
import { buildRoadmapPlan, type RoadmapItem } from "@/lib/roadmapPlan";
import type { Course } from "@/lib/courses";
import { LESSON_PROGRESS_EVENT, lessonProgressPercent, readLessonProgress } from "@/lib/lessonProgress";
import { cn } from "@/lib/cn";
import { getMediaUrl } from "@/lib/media";
import { getDirectionalTextProps } from "@/lib/textDirection";
import styles from "./LearningRoadmap.module.css";

export default function LearningRoadmap({ userId }: { userId: number }) {
    const [path, setPath] = useState<LearningPath | null>(null);
    const [catalog, setCatalog] = useState<Course[]>([]);
    const [percentages, setPercentages] = useState<Record<number, number>>({});
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const requestId = useRef(0);
    const load = useCallback(async (signal?: AbortSignal, background = false) => {
        const request = ++requestId.current;
        if (!background) setLoading(true);
        setError(false);
        try {
            const [result, courses] = await Promise.all([fetchLearningPath(signal), fetchLearningPathCatalog(signal).catch(() => [])]);
            if (signal?.aborted || request !== requestId.current) return;
            setPath(result);
            setCatalog(courses);
            setPercentages(Object.fromEntries(result.steps.map(step => [step.lesson_id, lessonProgressPercent(readLessonProgress(userId, step.lesson_id))])));
        } catch {
            if (!signal?.aborted && request === requestId.current) setError(true);
        } finally {
            if (!signal?.aborted && request === requestId.current) setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        const refresh = () => { if (!document.hidden) void load(controller.signal, true); };
        const saved = (event: Event) => {
            if ((event as CustomEvent<{ userId: number }>).detail?.userId === userId) refresh();
        };
        const stored = (event: StorageEvent) => {
            if (event.key?.startsWith("chinverse.lesson-progress." + userId + ".")) refresh();
        };
        window.addEventListener("focus", refresh);
        window.addEventListener(LESSON_PROGRESS_EVENT, saved);
        window.addEventListener("storage", stored);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            controller.abort();
            window.removeEventListener("focus", refresh);
            window.removeEventListener(LESSON_PROGRESS_EVENT, saved);
            window.removeEventListener("storage", stored);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [load, userId]);

    const roadmap = useMemo(() => path ? buildRoadmapPlan(path, catalog) : null, [path, catalog]);

    return <section aria-labelledby="learning-path-title" className={styles.roadmap}>
        <div className={styles.intro}>
            <h2 id="learning-path-title" className="flex items-center gap-2 text-xl font-black text-[#20294e] dark:text-white"><Map aria-hidden className="size-6 text-[#6e819b]" />مسیر یادگیری</h2>
            <p className="mt-2 text-xs leading-6 text-[#586e85] dark:text-slate-300">هر مرحله، یک قدم به دنیای زبان چینی نزدیک‌تر.</p>
            {roadmap && roadmap.total_count > 0 && <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-bold text-[#155aa6] dark:text-blue-200">
                    <p>{roadmap.completed_count.toLocaleString("fa-IR")} از {roadmap.total_count.toLocaleString("fa-IR")} مرحله کامل شده</p>
                    <span>{Math.round(roadmap.completed_count / roadmap.total_count * 100).toLocaleString("fa-IR")}٪</span>
                </div>
                <div role="progressbar" aria-label="پیشرفت مسیر یادگیری" aria-valuemin={0} aria-valuemax={roadmap.total_count} aria-valuenow={roadmap.completed_count} className="h-1.5 overflow-hidden rounded-full bg-[#dceaf4] dark:bg-slate-700">
                    <div className="h-full rounded-full bg-[#0783e8] transition-[width] motion-reduce:transition-none" style={{ width: roadmap.completed_count / roadmap.total_count * 100 + "%" }} />
                </div>
                {roadmap.upcoming_count > 0 && <p className="mt-2 text-[10px] leading-5 text-slate-500 dark:text-slate-300">{roadmap.upcoming_count.toLocaleString("fa-IR")} مرحله در حال آماده‌سازی است.</p>}
            </div>}
        </div>
        {loading ? <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-300"><Loader2 className="size-5 animate-spin" />در حال دریافت مسیر…</div>
        : error && !path ? <div role="alert" className="p-6 text-center text-sm leading-7 text-slate-600 dark:text-slate-300"><p>مسیر یادگیری دریافت نشد.</p><button type="button" onClick={() => void load()} className="mt-3 min-h-11 rounded-xl bg-[#155aa6] px-5 font-bold text-white">تلاش دوباره</button></div>
        : !roadmap ? null
        : <>
            {!path?.steps.length && <div className="px-5 pt-5 text-center"><h3 className="font-bold text-slate-800 dark:text-white">مسیرت به‌زودی شروع می‌شود</h3><p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-300">برنامهٔ درس‌ها را اینجا می‌بینی. مرحله‌ها پس از انتشار محتوا باز می‌شوند.</p><Link href="/explore" className="mt-2 inline-flex min-h-11 items-center px-4 text-xs font-bold text-[#155aa6] dark:text-blue-200">رفتن به کاوش</Link></div>}
            {error && <p role="alert" className="mx-5 mt-3 text-xs leading-6 text-amber-800 dark:text-amber-200">به‌روزرسانی مسیر انجام نشد. <button type="button" onClick={() => void load(undefined, true)} className="min-h-11 underline">تلاش دوباره</button></p>}
            <div className={styles.journey}>
                <div aria-hidden className={styles.scenery} />
                <ol className={styles.steps} aria-label="مرحله‌های مسیر یادگیری">
                    {roadmap.steps.map((step, index) => <RoadmapStep key={step.key} step={step} index={index} last={index === roadmap.steps.length - 1} percent={step.lesson_id === null ? 0 : percentages[step.lesson_id] || 0} />)}
                </ol>
                <div className={styles.finish}>
                    {path && path.total_count > 0 && path.completed_count === path.total_count ? <p role="status"><Sparkles aria-hidden className="mx-auto mb-2 size-5 text-emerald-600" />آفرین! درس‌های قابل پخش را کامل کردی. مرحله‌های در حال آماده‌سازی پس از انتشار و تکمیل پیش‌نیاز باز می‌شوند.</p>
                    : <p>با تماشای دست‌کم ۹۰٪ ویدیو، مرحلهٔ منتشرشدهٔ بعد باز می‌شود.<br />مرحله‌های در حال آماده‌سازی تا انتشار محتوا قفل می‌مانند.</p>}
                </div>
            </div>
        </>}
    </section>;
}

function RoadmapStep({ step, index, last, percent }: { step: RoadmapItem; index: number; last: boolean; percent: number }) {
    const locked = step.state === "locked", completed = step.state === "completed";
    const content = <>
        <span className={cn(styles.number, completed ? styles.completed : locked ? styles.locked : styles.current)} aria-hidden>{completed ? <Check size={19} /> : (index + 1).toLocaleString("fa-IR")}</span>
        <span className={cn(styles.thumbnail, step.kind === "explore" && styles.exploreThumbnail)}>
            {step.cover_url ? <Image src={step.availability === "upcoming" ? step.cover_url : getMediaUrl(step.cover_url)} alt="" fill sizes="80px" className="object-cover" unoptimized />
            : step.kind === "explore" ? <Clapperboard aria-hidden className="size-9 text-[#6552b3]" strokeWidth={1.5} /> : <BookOpen aria-hidden className="size-9 text-[#377caa]" strokeWidth={1.5} />}
            <span className={styles.play} aria-hidden>{locked ? <LockKeyhole size={14} /> : completed ? <Check size={17} /> : <Play size={15} className="fill-current" />}</span>
        </span>
        <span className={styles.copy}>
            <span className={cn(styles.kind, step.kind === "explore" && styles.exploreKind)}>{step.kind === "explore" ? "کاوش · ویدیوی پیشنهادی" : step.course_title}</span>
            <span className={styles.title} {...getDirectionalTextProps(step.title)}>{step.title}</span>
            {step.summary && <span className={styles.summary} {...getDirectionalTextProps(step.summary)}>{step.summary}</span>}
            <span className={styles.meta}>{step.availability === "upcoming" ? <><LockKeyhole aria-hidden size={13} />به‌زودی</> : <><Clock3 aria-hidden size={13} />{step.duration_minutes > 0 ? Math.ceil(step.duration_minutes).toLocaleString("fa-IR") + " دقیقه" : "ویدیوی آموزشی"}</>}</span>
            {!locked && !completed && percent > 0 ? <span className={styles.partial}><span>{percent.toLocaleString("fa-IR")}٪ تماشا شده · ادامهٔ درس</span><span className={styles.partialTrack}><i style={{ width: percent + "%" }} /></span></span>
            : <span className={cn(styles.status, completed && styles.completeLabel)}>{step.availability === "upcoming" ? "در حال آماده‌سازی" : completed ? "تماشا شده · تماشای دوباره" : locked ? "بعد از مرحلهٔ قبل" : "شروع این مرحله"}</span>}
        </span>
        {!locked && <ChevronLeft aria-hidden size={18} className="shrink-0 text-[#087bdb] dark:text-blue-300" />}
    </>;
    const label = "مرحلهٔ " + (index + 1).toLocaleString("fa-IR") + ": " + step.title;
    return <li className={styles.step} data-state={step.state} data-availability={step.availability}>
        {!last && <svg aria-hidden className={styles.trail} viewBox="0 0 80 180" preserveAspectRatio="none">
            <path d="M 65 0 C 62 48, 4 36, 10 86 S 70 132, 65 180" fill="none" stroke="#c3dbee" strokeWidth="4" />
            <path d="M 65 0 C 62 48, 4 36, 10 86 S 70 132, 65 180" fill="none" stroke="#fbfdff" strokeWidth="2" strokeDasharray="2 11" strokeLinecap="round" />
            {[["45", "37"], ["11", "76"], ["24", "115"], ["61", "151"]].map(([cx, cy]) => <circle key={cy} cx={cx} cy={cy} r="4" fill="#fff" stroke="#b5cfe4" strokeWidth="1.5" />)}
        </svg>}
        {step.availability === "upcoming" || locked ? <div className={cn(styles.card, styles.lockedCard)} aria-label={label + "، قفل است"} aria-disabled="true">{content}</div>
        : <Link href={learningPathLessonHref(step)} className={styles.card} aria-label={label} aria-current={step.state === "current" ? "step" : undefined}>{content}</Link>}
    </li>;
}
