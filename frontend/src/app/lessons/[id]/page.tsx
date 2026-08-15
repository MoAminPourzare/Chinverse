"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls, { ErrorTypes } from "hls.js";
import { MoreVertical } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Surface from "@/components/ui/Surface";
import { BackButton } from "@/components/ui/IconButton";
import { getReturnToHref } from "@/lib/returnTo";
import {
    findActivePlaybackCueIndex,
    millisecondsUntilPlaybackRefresh,
    selectInitialSubtitleTrack,
    type LessonPlayback,
} from "@/lib/lessonPlayback";
import { lessonPlaybackService } from "@/services/lessonPlayback.service";

const languageLabels: Record<string, string> = { fa: "فارسی", "fa-ir": "فارسی", en: "English", zh: "中文", "zh-cn": "中文" };

export default function LessonPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = typeof params?.id === "string" ? Number(params.id) : NaN;
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playback, setPlayback] = useState<LessonPlayback | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryable, setRetryable] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const pendingResumeRef = useRef<{ position: number; shouldPlay: boolean } | null>(null);

    const loadPlayback = useCallback(async (forceRefresh = false, preservePosition = false) => {
        if (!Number.isSafeInteger(lessonId) || lessonId <= 0) {
            setError("شناسهٔ درس معتبر نیست.");
            setRetryable(false);
            setLoading(false);
            return;
        }
        if (preservePosition && videoRef.current) {
            pendingResumeRef.current = { position: videoRef.current.currentTime || 0, shouldPlay: !videoRef.current.paused };
        }
        setLoading(true);
        setError(null);
        try {
            const nextPlayback = await lessonPlaybackService.fetch(lessonId, { forceRefresh });
            if (!nextPlayback.entitlement.granted) {
                setError(nextPlayback.entitlement.reason || "این درس در اشتراک فعلی شما در دسترس نیست.");
                setRetryable(false);
                setPlayback(null);
                return;
            }
            setPlayback(nextPlayback);
            setSelectedLanguage((current) => current && nextPlayback.subtitles.some((track) => track.language === current)
                ? current
                : selectInitialSubtitleTrack(nextPlayback.subtitles, "fa")?.language || null);
        } catch (requestError) {
            if (typeof requestError === "object" && requestError && "response" in requestError) {
                const status = (requestError as { response?: { status?: number } }).response?.status;
                if (status === 401) setError("برای دیدن این درس وارد حساب خودت شو.");
                else if (status === 403) setError("این درس در اشتراک فعلی شما در دسترس نیست.");
                else if (status === 404) setError("این درس هنوز منتشر نشده یا رسانهٔ قابل پخشی ندارد.");
                else setError("دریافت پخش امن انجام نشد. دوباره تلاش کن.");
            } else {
                setError("دریافت پخش امن انجام نشد. دوباره تلاش کن.");
            }
            setRetryable(true);
            setPlayback(null);
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => { void loadPlayback(); }, [loadPlayback]);

    useEffect(() => {
        if (!playback) return;
        const wait = millisecondsUntilPlaybackRefresh(playback.media.expiresAt);
        if (wait === null) return;
        const timer = window.setTimeout(() => void loadPlayback(true, true), Math.max(wait, 1_000));
        return () => window.clearTimeout(timer);
    }, [loadPlayback, playback]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !playback) return;
        const source = playback.media.playbackUrl;
        setIsPlaying(false);
        const onFatal = () => {
            setError("مرورگر نتوانست این رسانه را پخش کند. برای دریافت لینک تازه دوباره تلاش کن.");
            setRetryable(true);
        };
        if (playback.media.playbackType !== "hls" || video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
            video.load();
            return () => { video.removeAttribute("src"); video.load(); };
        }
        if (!Hls.isSupported()) {
            setError("این مرورگر از پخش HLS پشتیبانی نمی‌کند.");
            setRetryable(false);
            return;
        }
        const hls = new Hls({ enableWorker: true, startLevel: -1 });
        let networkRetries = 0;
        hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            if (data.type === ErrorTypes.NETWORK_ERROR && networkRetries < 2) {
                networkRetries += 1;
                hls.startLoad();
            } else if (data.type === ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
            } else {
                hls.destroy();
                onFatal();
            }
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        return () => { hls.destroy(); video.removeAttribute("src"); video.load(); };
    }, [playback]);

    const track = useMemo(() => playback?.subtitles.find((item) => item.language === selectedLanguage)
        || (playback ? selectInitialSubtitleTrack(playback.subtitles, "fa") : null), [playback, selectedLanguage]);
    const activeIndex = findActivePlaybackCueIndex(track?.cues || [], currentTime);
    const poster = playback?.media.posterUrl || undefined;

    if (loading && !playback) return <div className="flex min-h-full items-center justify-center text-sm font-bold text-slate-500">در حال دریافت پخش امن…</div>;

    return (
        <div className="flex min-h-full flex-col bg-[#f7f8fa] px-4 pb-5 pt-4" dir="rtl">
            <header className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center gap-3">
                <BackButton onClick={() => router.back()} className="justify-self-end" />
                <div className="min-w-0 text-center">
                    <h1 className="truncate text-base font-black text-slate-900">{playback?.lesson.title || "درس"}</h1>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">پخش رسانهٔ منتشرشده</p>
                </div>
                <button type="button" onClick={() => router.push(getReturnToHref("/settings/appearance"))} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-[#dfe6f0]" aria-label="تنظیمات نمایش"><MoreVertical size={20} /></button>
            </header>
            <main className="mx-auto mt-4 flex w-full max-w-[430px] flex-1 flex-col gap-4">
                <Surface className="overflow-hidden p-0">
                    <div className="relative aspect-video w-full bg-slate-950">
                        <video
                            ref={videoRef}
                            controls
                            playsInline
                            preload="metadata"
                            poster={poster}
                            className="h-full w-full"
                            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                            onLoadedMetadata={(event) => {
                                const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : playback?.lesson.durationSeconds || 0;
                                setDuration(nextDuration);
                                const resume = pendingResumeRef.current;
                                pendingResumeRef.current = null;
                                if (resume) {
                                    event.currentTarget.currentTime = Math.min(Math.max(resume.position, 0), nextDuration || resume.position);
                                    if (resume.shouldPlay) void event.currentTarget.play().catch(() => undefined);
                                }
                            }}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onError={() => { if (playback) { setError("مرورگر نتوانست این رسانه را پخش کند."); setRetryable(true); } }}
                        />
                        {error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center text-sm font-black leading-7 text-white" role="alert"><span>{error}</span><div className="flex gap-2">{error.includes("وارد حساب") && <a href={`/login?next=${encodeURIComponent(`/lessons/${lessonId}`)}`} className="rounded-xl bg-white px-4 py-2 text-xs text-slate-900">ورود</a>}{error.includes("اشتراک") && <a href="/settings/subscription" className="rounded-xl bg-white px-4 py-2 text-xs text-slate-900">اشتراک</a>}{retryable && <button type="button" onClick={() => void loadPlayback(true, true)} className="rounded-xl bg-white px-4 py-2 text-xs text-slate-900">تلاش دوباره</button>}</div></div>}
                    </div>
                </Surface>
                <Surface className="p-4">
                    {playback && playback.subtitles.length > 1 && <label className="mb-3 flex items-center justify-between gap-3 text-xs font-black text-slate-600">زبان زیرنویس<select value={track?.language || ""} onChange={(event) => setSelectedLanguage(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs" aria-label="زبان زیرنویس">{playback.subtitles.map((item) => <option key={item.id} value={item.language}>{languageLabels[item.language] || item.language.toUpperCase()}</option>)}</select></label>}
                    {track && <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-500" aria-label="کیفیت زیرنویس"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">همگام‌سازی تأییدشده</span>{track.qualityScore !== null && <span>امتیاز کیفیت: {Math.round(track.qualityScore)}٪</span>}{track.qualityWarnings.length > 0 && <span className="text-amber-700">{track.qualityWarnings.length} هشدار غیرمسدودکننده</span>}</div>}
                    {!track || track.cues.length === 0 ? <p className="text-center text-sm font-bold leading-7 text-slate-400">برای این درس زیرنویس منتشرشده‌ای وجود ندارد.</p> : <div className="max-h-[390px] space-y-2 overflow-y-auto">{track.cues.map((cue, index) => <button type="button" key={`${track.id}-${cue.id}`} onClick={() => { if (videoRef.current) videoRef.current.currentTime = cue.start + 0.02; setCurrentTime(cue.start + 0.02); }} className={`block w-full rounded-2xl px-3 py-3 text-center ${index === activeIndex ? "bg-[#eef6ff] ring-1 ring-[#c5dbf3]" : "bg-slate-50"}`} aria-label={`رفتن به ${Math.floor(cue.start)} ثانیه`}>{cue.chinese && <p className="font-cjk text-base font-black text-slate-800" dir="ltr" lang="zh-CN">{cue.chinese}</p>}{cue.pinyin && <p className="font-latin text-xs text-slate-400" dir="ltr">{cue.pinyin}</p>}{cue.translation && <p className="mt-1 text-sm text-slate-600">{cue.translation}</p>}</button>)}</div>}
                    {playback && duration > 0 && <p className="mt-3 text-center text-[11px] font-bold text-slate-400">{isPlaying ? "در حال پخش" : "متوقف"} · {Math.floor(currentTime)} / {Math.floor(duration)} ثانیه</p>}
                </Surface>
            </main>
        </div>
    );
}
