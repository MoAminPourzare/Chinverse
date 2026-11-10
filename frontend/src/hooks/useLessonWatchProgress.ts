"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { dailyActivityService } from "@/services/dailyActivity.service";
import { watchedSecondsBetween, type PlaybackSample } from "@/lib/watchProgress";
import { acknowledgeLessonProgress, lessonProgressPercent, readLessonProgress } from "@/lib/lessonProgress";

export function useLessonWatchProgress(videoRef: RefObject<HTMLVideoElement | null>, lessonId: number | null, userId: number | null, ready: boolean) {
    const [state, setState] = useState({ lessonId, completed: false, saving: false, error: false, percent: 0 });
    const flushRef = useRef<(force?: boolean) => Promise<void>>(async () => undefined);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !lessonId || !userId || !ready) return;
        let active = true, pending = 0, pendingStudy = 0;
        let inFlight: Promise<void> | null = null, flushAgain = false;
        let lastPosition = 0, lastDuration = 0;
        let acknowledged = readLessonProgress(userId, lessonId);
        let observedWatched = acknowledged.watchedSeconds;
        const sample = (): PlaybackSample => ({ at: performance.now(), position: video.currentTime || 0, rate: video.playbackRate, playing: !video.paused && !video.ended, seeking: video.seeking });
        let previous = sample();
        const tick = () => {
            if (!active) return;
            const current = sample();
            const advanced = watchedSecondsBetween(previous, current);
            pending += advanced;
            observedWatched += advanced;
            pendingStudy += advanced / Math.max(0.25, Math.min(previous.rate, 4));
            lastPosition = Math.floor(current.position);
            lastDuration = Number.isFinite(video.duration) ? Math.round(video.duration) : 0;
            previous = current;
            const percent = lessonProgressPercent({ watchedSeconds: observedWatched, positionSeconds: Math.max(acknowledged.positionSeconds, lastPosition), durationSeconds: lastDuration || acknowledged.durationSeconds });
            setState(current => current.lessonId === lessonId && current.percent === percent ? current : { ...current, lessonId, percent, completed: current.lessonId === lessonId && current.completed });
        };
        const flush = async (force = false): Promise<void> => {
            tick();
            if (inFlight) { if (force) flushAgain = true; return inFlight; }
            const delta = Math.min(Math.floor(pending), 300);
            if ((!force && delta < 5) || (delta === 0 && Math.floor(pendingStudy) === 0)) return;
            const studyDelta = Math.min(Math.floor(pendingStudy), 300);
            const position = lastPosition;
            const duration = lastDuration;
            pending -= delta;
            pendingStudy -= studyDelta;
            if (active) setState(current => ({ ...current, lessonId, completed: current.lessonId === lessonId && current.completed, saving: true, error: false }));
            inFlight = (async () => {
                try {
                    const result = await dailyActivityService.recordVideoProgress({ lesson_id: lessonId, seconds_delta: delta, study_seconds_delta: studyDelta, position_seconds: position, duration_seconds: duration });
                    acknowledged = acknowledgeLessonProgress(userId, lessonId, delta, position, duration);
                    if (active) setState(current => ({ ...current, lessonId, completed: (current.lessonId === lessonId && current.completed) || Boolean(result?.lesson_completed), saving: false, error: false }));
                } catch {
                    pending += delta;
                    pendingStudy += studyDelta;
                    if (active) setState(current => ({ ...current, lessonId, saving: false, error: true }));
                } finally {
                    inFlight = null;
                    if (flushAgain) { flushAgain = false; void flush(true); }
                }
            })();
            return inFlight;
        };
        flushRef.current = flush;
        const resetSample = () => { previous = sample(); };
        const finish = () => { tick(); void flush(true); };
        const visibility = () => { if (document.hidden) void flush(true); };
        const interval = window.setInterval(() => { tick(); if (pending >= 5) void flush(); }, 1000);
        video.addEventListener("timeupdate", tick);
        video.addEventListener("play", resetSample);
        video.addEventListener("seeking", resetSample);
        video.addEventListener("seeked", resetSample);
        video.addEventListener("pause", finish);
        video.addEventListener("ended", finish);
        document.addEventListener("visibilitychange", visibility);
        window.addEventListener("pagehide", finish);
        return () => {
            // Freeze this lesson's sample before the shared video element is
            // reused by the next lesson, including while a save is in flight.
            tick();
            active = false;
            void flush(true);
            flushRef.current = async () => undefined;
            window.clearInterval(interval);
            video.removeEventListener("timeupdate", tick);
            video.removeEventListener("play", resetSample);
            video.removeEventListener("seeking", resetSample);
            video.removeEventListener("seeked", resetSample);
            video.removeEventListener("pause", finish);
            video.removeEventListener("ended", finish);
            document.removeEventListener("visibilitychange", visibility);
            window.removeEventListener("pagehide", finish);
        };
    }, [lessonId, userId, ready, videoRef]);

    const flush = useCallback((force = true) => flushRef.current(force), []);
    return { ...state, percent: state.lessonId === lessonId ? state.percent : 0, saving: state.lessonId === lessonId && state.saving, completed: state.lessonId === lessonId && state.completed, error: state.lessonId === lessonId && state.error, flush };
}
