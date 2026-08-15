"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls, { ErrorTypes } from "hls.js";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FastForward, Maximize, Minimize, MoreVertical, Pause, Play, Rewind } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { cn } from "@/lib/cn";
import { isHttpStatus } from "@/lib/http";
import {
    findActivePlaybackCueIndex,
    millisecondsUntilPlaybackRefresh,
    selectInitialSubtitleTrack,
    type LessonPlayback,
} from "@/lib/lessonPlayback";
import { getDirectionalTextProps } from "@/lib/textDirection";
import { getReturnToHref } from "@/lib/returnTo";
import { getHighlightStyle, useLearningPreferences } from "@/lib/learningPreferences";
import Surface from "@/components/ui/Surface";
import { BackButton } from "@/components/ui/IconButton";
import { dailyActivityService } from "@/services/dailyActivity.service";
import { lessonPlaybackService } from "@/services/lessonPlayback.service";

const VocabularyModal = dynamic(() => import("@/components/lms/VocabularyModal"), { ssr: false });

interface Lesson {
    id: number;
    title: string;
    duration_minutes?: number;
    is_free?: boolean;
}

interface Section {
    id?: number;
    title?: string;
    lessons: Lesson[];
}

interface Course {
    id: number;
    title: string;
    description: string;
    level: string;
    sections: Section[];
}

interface VocabularyWord {
    id: number;
    chinese: string;
    pinyin: string;
    audio_url?: string;
    persian_meaning?: string;
    chinese_meaning?: string;
    composition?: string;
    examples: Array<{
        id: number;
        zh_text: string;
        pinyin: string;
        target_text: string;
    }>;
}

interface VocabularyMatchesResponse {
    matches: string[][];
}

type PlaybackErrorKind = "login" | "entitlement" | "missing" | "network" | "media" | "unsupported";

interface PlaybackErrorState {
    kind: PlaybackErrorKind;
    message: string;
    retryable: boolean;
}

const LANGUAGE_LABELS: Record<string, string> = {
    fa: "فارسی",
    "fa-ir": "فارسی",
    en: "English",
    zh: "中文",
    "zh-cn": "中文",
    "zh-fa": "چینی / فارسی",
};

const playbackErrorFromApi = (error: unknown): PlaybackErrorState => {
    if (isHttpStatus(error, 401)) {
        return { kind: "login", message: "برای دیدن این درس وارد حساب خودت شو.", retryable: false };
    }
    if (isHttpStatus(error, 403)) {
        return { kind: "entitlement", message: "این درس در اشتراک فعلی شما در دسترس نیست.", retryable: false };
    }
    if (isHttpStatus(error, 404)) {
        return { kind: "missing", message: "این درس هنوز منتشر نشده یا رسانهٔ قابل پخشی ندارد.", retryable: false };
    }
    return { kind: "network", message: "دریافت پخش امن انجام نشد. اتصال را بررسی و دوباره تلاش کن.", retryable: true };
};

const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function SharedWatchPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { preferences } = useLearningPreferences();
    const domain = typeof params?.domain === "string" ? params.domain : "hsk";
    const courseId = typeof params?.courseId === "string" ? params.courseId : "";
    const lessonIdParam = searchParams.get("lesson");

    const [course, setCourse] = useState<Course | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [courseLoading, setCourseLoading] = useState(true);
    const [courseError, setCourseError] = useState<string | null>(null);
    const [playback, setPlayback] = useState<LessonPlayback | null>(null);
    const [playbackLoading, setPlaybackLoading] = useState(false);
    const [playbackError, setPlaybackError] = useState<PlaybackErrorState | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
    const [showVocabModal, setShowVocabModal] = useState(false);
    const [loadingVocabularyWord, setLoadingVocabularyWord] = useState<string | null>(null);
    const [vocabularyError, setVocabularyError] = useState<string | null>(null);
    const [vocabularyMatches, setVocabularyMatches] = useState<string[][]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const subtitleListRef = useRef<HTMLDivElement>(null);
    const activeSubtitleRef = useRef<HTMLButtonElement | null>(null);
    const playbackRequestIdRef = useRef(0);
    const pendingResumeRef = useRef<{ position: number; shouldPlay: boolean } | null>(null);
    const pendingWatchSecondsRef = useRef(0);
    const lastWatchTickRef = useRef<number | null>(null);
    const isFlushingWatchRef = useRef(false);
    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const lessonIdRef = useRef<number | null>(null);
    const vocabularyRequestIdRef = useRef(0);
    const resumeVideoAfterVocabularyRef = useRef(false);

    const openAppearanceSettings = useCallback(() => {
        router.push(getReturnToHref("/settings/appearance"));
    }, [router]);

    useEffect(() => {
        const parsedCourseId = Number(courseId);
        if (!Number.isSafeInteger(parsedCourseId) || parsedCourseId <= 0) {
            setCourseError("شناسهٔ دوره معتبر نیست.");
            setCourseLoading(false);
            return;
        }

        const controller = new AbortController();
        setCourseLoading(true);
        setCourseError(null);
        api.get<Course>(`/courses/${parsedCourseId}`, { signal: controller.signal })
            .then((response) => {
                const courseData = response.data;
                const lessons = courseData.sections?.flatMap((section) => section.lessons || []) || [];
                const requestedLessonId = Number(lessonIdParam);
                const requestedLesson = Number.isSafeInteger(requestedLessonId)
                    ? lessons.find((lesson) => lesson.id === requestedLessonId)
                    : null;
                setCourse(courseData);
                setCurrentLesson(requestedLesson || lessons[0] || null);
                if (lessonIdParam && !requestedLesson && lessons[0]) {
                    router.replace(`/watch/${encodeURIComponent(domain)}/${courseData.id}?lesson=${lessons[0].id}`);
                }
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setCourse(null);
                setCurrentLesson(null);
                setCourseError(isHttpStatus(error, 404) ? "دوره پیدا نشد." : "دریافت دوره انجام نشد.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setCourseLoading(false);
            });
        return () => controller.abort();
    }, [courseId, domain, lessonIdParam, router]);

    const loadPlayback = useCallback(async (
        lessonId: number,
        options: { forceRefresh?: boolean; preservePosition?: boolean; signal?: AbortSignal } = {},
    ) => {
        const requestId = playbackRequestIdRef.current + 1;
        playbackRequestIdRef.current = requestId;
        if (options.preservePosition && videoRef.current) {
            pendingResumeRef.current = {
                position: videoRef.current.currentTime || 0,
                shouldPlay: !videoRef.current.paused && !videoRef.current.ended,
            };
        }
        setPlaybackLoading(true);
        setPlaybackError(null);
        try {
            const nextPlayback = await lessonPlaybackService.fetch(lessonId, {
                forceRefresh: options.forceRefresh,
                signal: options.signal,
            });
            if (playbackRequestIdRef.current !== requestId) return;
            if (nextPlayback.lesson.id !== lessonId || (course && nextPlayback.lesson.courseId !== course.id)) {
                throw new Error("Playback response does not match the selected lesson");
            }
            if (!nextPlayback.entitlement.granted) {
                setPlayback(null);
                setPlaybackError({
                    kind: "entitlement",
                    message: nextPlayback.entitlement.reason || "این درس در اشتراک فعلی شما در دسترس نیست.",
                    retryable: false,
                });
                return;
            }
            setPlayback(nextPlayback);
            setSelectedLanguage((current) => {
                if (current && nextPlayback.subtitles.some((track) => track.language === current)) return current;
                return selectInitialSubtitleTrack(nextPlayback.subtitles, "fa")?.language || null;
            });
        } catch (error) {
            if (options.signal?.aborted || playbackRequestIdRef.current !== requestId) return;
            setPlayback(null);
            setPlaybackError(playbackErrorFromApi(error));
        } finally {
            if (playbackRequestIdRef.current === requestId) setPlaybackLoading(false);
        }
    }, [course]);

    useEffect(() => {
        if (!currentLesson) {
            setPlayback(null);
            return;
        }
        const controller = new AbortController();
        pendingResumeRef.current = null;
        setCurrentTime(0);
        setDuration(Math.max((currentLesson.duration_minutes || 0) * 60, 0));
        currentTimeRef.current = 0;
        durationRef.current = Math.max((currentLesson.duration_minutes || 0) * 60, 0);
        void loadPlayback(currentLesson.id, { signal: controller.signal });
        return () => controller.abort();
    }, [currentLesson, loadPlayback]);

    useEffect(() => {
        if (!playback) return;
        const wait = millisecondsUntilPlaybackRefresh(playback.media.expiresAt);
        if (wait === null) return;
        const timeout = window.setTimeout(() => {
            void loadPlayback(playback.lesson.id, { forceRefresh: true, preservePosition: true });
        }, Math.max(wait, 1_000));
        return () => window.clearTimeout(timeout);
    }, [loadPlayback, playback]);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (videoRef.current) videoRef.current.playbackRate = preferences.playbackSpeed;
    }, [preferences.playbackSpeed, currentLesson?.id]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !playback) return;
        const sourceUrl = playback.media.playbackUrl;
        setIsPlaying(false);
        setPlaybackError(null);

        const failPlayback = (kind: "media" | "unsupported", message: string) => {
            setPlaybackError({ kind, message, retryable: kind === "media" });
            setIsPlaying(false);
        };

        if (playback.media.playbackType === "mp4") {
            video.src = sourceUrl;
            video.load();
            return () => {
                video.removeAttribute("src");
                video.load();
            };
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
            video.load();
            return () => {
                video.removeAttribute("src");
                video.load();
            };
        }

        if (!Hls.isSupported()) {
            failPlayback("unsupported", "این مرورگر از پخش HLS پشتیبانی نمی‌کند.");
            return;
        }

        const hls = new Hls({ enableWorker: true, startLevel: -1 });
        let networkRetries = 0;
        let recoveredMediaError = false;
        hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            if (data.type === ErrorTypes.NETWORK_ERROR && networkRetries < 2) {
                networkRetries += 1;
                hls.startLoad();
                return;
            }
            if (data.type === ErrorTypes.MEDIA_ERROR && !recoveredMediaError) {
                recoveredMediaError = true;
                hls.recoverMediaError();
                return;
            }
            hls.destroy();
            failPlayback("media", "پخش ویدئو متوقف شد. برای دریافت لینک تازه دوباره تلاش کن.");
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);

        return () => {
            hls.destroy();
            video.removeAttribute("src");
            video.load();
        };
    }, [playback]);

    const flushWatchProgress = useCallback(async (force = false) => {
        const lessonId = lessonIdRef.current;
        const secondsDelta = Math.floor(pendingWatchSecondsRef.current);
        if (!lessonId || isFlushingWatchRef.current || secondsDelta <= 0) return;
        if (!force && secondsDelta < 15) return;

        pendingWatchSecondsRef.current = Math.max(0, pendingWatchSecondsRef.current - secondsDelta);
        isFlushingWatchRef.current = true;
        try {
            await dailyActivityService.recordVideoProgress({
                lesson_id: lessonId,
                seconds_delta: Math.min(secondsDelta, 300),
                position_seconds: Math.floor(currentTimeRef.current || 0),
                duration_seconds: Math.floor(durationRef.current || 0),
            });
        } catch {
            pendingWatchSecondsRef.current += secondsDelta;
        } finally {
            isFlushingWatchRef.current = false;
        }
    }, []);

    useEffect(() => {
        lessonIdRef.current = currentLesson?.id || null;
        pendingWatchSecondsRef.current = 0;
        lastWatchTickRef.current = null;
        return () => void flushWatchProgress(true);
    }, [currentLesson?.id, flushWatchProgress]);

    useEffect(() => {
        if (!isPlaying || !currentLesson?.id) {
            lastWatchTickRef.current = null;
            return;
        }
        lastWatchTickRef.current = Date.now();
        const interval = window.setInterval(() => {
            const now = Date.now();
            const lastTick = lastWatchTickRef.current || now;
            pendingWatchSecondsRef.current += Math.min(Math.max((now - lastTick) / 1000, 0), 2);
            lastWatchTickRef.current = now;
            if (pendingWatchSecondsRef.current >= 15) void flushWatchProgress();
        }, 1_000);
        return () => window.clearInterval(interval);
    }, [currentLesson?.id, flushWatchProgress, isPlaying]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) void flushWatchProgress(true);
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            void flushWatchProgress(true);
        };
    }, [flushWatchProgress]);

    const selectedTrack = useMemo(() => {
        if (!playback) return null;
        return playback.subtitles.find((track) => track.language === selectedLanguage)
            || selectInitialSubtitleTrack(playback.subtitles, "fa");
    }, [playback, selectedLanguage]);
    const baseTranscript = useMemo(() => selectedTrack?.cues || [], [selectedTrack]);

    useEffect(() => {
        if (baseTranscript.length === 0 || !baseTranscript.some((entry) => entry.chinese)) {
            setVocabularyMatches([]);
            return;
        }
        const controller = new AbortController();
        api.post<VocabularyMatchesResponse>("/vocabulary/matches", {
            texts: baseTranscript.map((entry) => entry.chinese),
        }, { signal: controller.signal })
            .then((response) => setVocabularyMatches(Array.isArray(response.data.matches) ? response.data.matches : []))
            .catch(() => {
                if (!controller.signal.aborted) setVocabularyMatches([]);
            });
        return () => controller.abort();
    }, [baseTranscript]);

    const syncedTranscript = useMemo(() => baseTranscript.map((entry, index) => ({
        ...entry,
        highlightedWords: vocabularyMatches[index] || entry.highlightedWords,
    })), [baseTranscript, vocabularyMatches]);
    const activeSubtitleIndex = useMemo(
        () => findActivePlaybackCueIndex(syncedTranscript, currentTime),
        [currentTime, syncedTranscript],
    );
    const activeSubtitle = activeSubtitleIndex >= 0 ? syncedTranscript[activeSubtitleIndex] : null;

    useEffect(() => {
        const subtitleList = subtitleListRef.current;
        const activeElement = activeSubtitleRef.current;
        if (!subtitleList || !activeElement || isFullscreen) return;
        const listRect = subtitleList.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        subtitleList.scrollTo({
            top: Math.max(subtitleList.scrollTop + activeRect.top - listRect.top - 8, 0),
            behavior: "smooth",
        });
    }, [activeSubtitleIndex, isFullscreen]);

    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (!video) return;
        const nextDuration = Number.isFinite(video.duration) ? video.duration : playback?.lesson.durationSeconds || 0;
        setDuration(nextDuration);
        durationRef.current = nextDuration;
        video.playbackRate = preferences.playbackSpeed;

        const resume = pendingResumeRef.current;
        pendingResumeRef.current = null;
        if (!resume) return;
        const position = Math.min(Math.max(resume.position, 0), Math.max(nextDuration - 0.1, 0));
        video.currentTime = position;
        setCurrentTime(position);
        currentTimeRef.current = position;
        if (resume.shouldPlay) void video.play().catch(() => undefined);
    };

    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video || playbackError?.kind === "unsupported") return;
        if (video.paused) {
            void video.play().catch(() => {
                setPlaybackError({ kind: "media", message: "مرورگر اجازهٔ شروع پخش را نداد. دوباره تلاش کن.", retryable: true });
            });
        } else {
            video.pause();
        }
    };

    const seekTo = (time: number) => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(time)) return;
        const nextTime = Math.min(Math.max(time, 0), duration || Number.POSITIVE_INFINITY);
        video.currentTime = nextTime;
        setCurrentTime(nextTime);
        currentTimeRef.current = nextTime;
    };

    const toggleFullscreen = async () => {
        if (!videoContainerRef.current) return;
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await videoContainerRef.current.requestFullscreen();
        } catch {
            setPlaybackError({ kind: "media", message: "تمام‌صفحه در این مرورگر در دسترس نیست.", retryable: false });
        }
    };

    const pauseVideoForVocabulary = useCallback(() => {
        const video = videoRef.current;
        const shouldResume = Boolean(video && !video.paused && !video.ended);
        resumeVideoAfterVocabularyRef.current = shouldResume;
        if (video && shouldResume) {
            video.pause();
            void flushWatchProgress(true);
        }
    }, [flushWatchProgress]);

    const resumeVideoAfterVocabulary = useCallback(() => {
        const shouldResume = resumeVideoAfterVocabularyRef.current;
        resumeVideoAfterVocabularyRef.current = false;
        const video = videoRef.current;
        if (!shouldResume || !video) return;
        video.playbackRate = preferences.playbackSpeed;
        void video.play().catch(() => undefined);
    }, [preferences.playbackSpeed]);

    const handleWordClick = async (word: string) => {
        pauseVideoForVocabulary();
        const requestId = vocabularyRequestIdRef.current + 1;
        vocabularyRequestIdRef.current = requestId;
        setLoadingVocabularyWord(word);
        setVocabularyError(null);
        try {
            const response = await api.get<VocabularyWord>(`/vocabulary/${encodeURIComponent(word)}`);
            if (vocabularyRequestIdRef.current !== requestId) return;
            setSelectedWord(response.data);
            setShowVocabModal(true);
        } catch {
            if (vocabularyRequestIdRef.current !== requestId) return;
            setVocabularyError("اطلاعات این واژه دریافت نشد. دوباره روی آن بزن.");
            resumeVideoAfterVocabulary();
        } finally {
            if (vocabularyRequestIdRef.current === requestId) setLoadingVocabularyWord(null);
        }
    };

    const renderChineseWithHighlights = (text: string, highlightedWords: string[]) => {
        const words = highlightedWords.filter(Boolean).sort((left, right) => right.length - left.length);
        const result: React.ReactNode[] = [];
        let remainingText = text;
        let key = 0;
        while (remainingText) {
            let foundWord = "";
            let foundIndex = -1;
            for (const word of words) {
                const index = remainingText.indexOf(word);
                if (index >= 0 && (foundIndex < 0 || index < foundIndex)) {
                    foundWord = word;
                    foundIndex = index;
                }
            }
            if (!foundWord || foundIndex < 0) {
                result.push(<span key={key++}>{remainingText}</span>);
                break;
            }
            if (foundIndex > 0) result.push(<span key={key++}>{remainingText.slice(0, foundIndex)}</span>);
            result.push(
                <button
                    key={key++}
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        void handleWordClick(foundWord);
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                    disabled={loadingVocabularyWord === foundWord}
                    aria-busy={loadingVocabularyWord === foundWord}
                    className="font-cjk px-1.5 transition brightness-100 hover:brightness-95 disabled:cursor-wait disabled:opacity-55"
                    style={getHighlightStyle(preferences.newWordHighlightColor)}
                    lang="zh-CN"
                >
                    {foundWord}
                </button>,
            );
            remainingText = remainingText.slice(foundIndex + foundWord.length);
        }
        return result;
    };

    if (courseLoading) {
        return <div className="flex min-h-full items-center justify-center text-sm font-bold text-slate-500">در حال بارگذاری دوره…</div>;
    }
    if (courseError || !course || !currentLesson) {
        return <div className="flex min-h-full items-center justify-center text-sm font-bold text-slate-500">{courseError || "این دوره درسی برای نمایش ندارد."}</div>;
    }

    const allLessons = course.sections?.flatMap((section) => section.lessons || []) || [];
    const lessonIndex = allLessons.findIndex((lesson) => lesson.id === currentLesson.id);
    const previousLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson = lessonIndex >= 0 ? allLessons[lessonIndex + 1] : null;
    const showChineseText = preferences.textDisplayMode !== "persian";
    const showTranslationText = preferences.textDisplayMode !== "chinese";
    const showPinyinText = preferences.showPinyin && showChineseText;
    const posterUrl = playback?.media.posterUrl || undefined;

    const handleVideoEnded = () => {
        void flushWatchProgress(true);
        if (preferences.autoplayNext && nextLesson) {
            router.push(`/watch/${encodeURIComponent(domain)}/${course.id}?lesson=${nextLesson.id}`);
        }
    };

    const errorAction = playbackError?.kind === "login"
        ? <Link href={`/login?next=${encodeURIComponent(`/watch/${domain}/${course.id}?lesson=${currentLesson.id}`)}`} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900">ورود به حساب</Link>
        : playbackError?.kind === "entitlement"
            ? <Link href="/settings/subscription" className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900">مشاهدهٔ اشتراک</Link>
            : playbackError?.retryable
                ? <button type="button" onClick={() => void loadPlayback(currentLesson.id, { forceRefresh: true, preservePosition: true })} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900">تلاش دوباره</button>
                : null;

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 py-5">
                <header className="sticky top-0 z-20 -mx-4 bg-[#f7f8fa]/90 px-4 py-2 backdrop-blur dark:bg-[#10151c]/92">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        <BackButton href={`/${encodeURIComponent(domain)}/${course.id}`} className="justify-self-end" />
                        <div className="min-w-0 text-center">
                            <p className="truncate text-[11px] font-black text-[#155aa6]" {...getDirectionalTextProps(course.title)}>{course.title}</p>
                            <h1 className="truncate text-sm font-black text-slate-900" {...getDirectionalTextProps(currentLesson.title)}>{currentLesson.title}</h1>
                        </div>
                        <button type="button" onClick={openAppearanceSettings} aria-label="تنظیمات نمایش درس" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-[#dfe6f0]">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </header>

                <section className="shrink-0 overflow-hidden rounded-[24px] border border-[#dfe6f0] bg-white p-2 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                    <div ref={videoContainerRef} className="lesson-video-shell relative aspect-video overflow-hidden rounded-[22px] bg-black">
                        <video
                            ref={videoRef}
                            className="lesson-video-element h-full w-full object-contain"
                            poster={posterUrl}
                            preload="metadata"
                            playsInline
                            onTimeUpdate={(event) => {
                                const time = event.currentTarget.currentTime;
                                setCurrentTime(time);
                                currentTimeRef.current = time;
                            }}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => {
                                setIsPlaying(false);
                                void flushWatchProgress(true);
                            }}
                            onEnded={handleVideoEnded}
                            onError={() => {
                                if (playback) setPlaybackError({ kind: "media", message: "مرورگر نتوانست این رسانه را پخش کند.", retryable: true });
                            }}
                            onClick={handlePlayPause}
                        >
                            Your browser does not support the video tag.
                        </video>

                        {(playbackLoading || playbackError) && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center text-white" role={playbackError ? "alert" : "status"} aria-live="polite">
                                {playbackLoading ? (
                                    <><div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" /><p className="text-xs font-bold">در حال دریافت لینک امن پخش…</p></>
                                ) : (
                                    <><p className="text-sm font-black leading-7">{playbackError?.message}</p>{errorAction}</>
                                )}
                            </div>
                        )}

                        {activeSubtitle && !playbackError && (
                            <div className={cn("lesson-fullscreen-captions", !(showTranslationText && showChineseText) && "lesson-fullscreen-captions-bottom")} aria-hidden={!isFullscreen}>
                                {showTranslationText && activeSubtitle.translation && <div className="lesson-caption-top">{activeSubtitle.translation}</div>}
                                {showChineseText && activeSubtitle.chinese && (
                                    <div className="lesson-caption-bottom font-cjk" lang="zh-CN" dir="ltr">
                                        <div>{renderChineseWithHighlights(activeSubtitle.chinese, activeSubtitle.highlightedWords)}</div>
                                        {showPinyinText && activeSubtitle.pinyin && <div className="lesson-caption-pinyin font-latin" lang="zh-Latn">{activeSubtitle.pinyin}</div>}
                                    </div>
                                )}
                            </div>
                        )}

                        {!playbackError && playback && (
                            <>
                                <div className="lesson-video-center-controls pointer-events-none absolute inset-0 flex items-center justify-center gap-5 bg-gradient-to-t from-black/35 via-transparent to-black/10">
                                    <button type="button" onClick={() => seekTo(currentTime - 10)} className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur" aria-label="۱۰ ثانیه عقب"><Rewind size={22} /></button>
                                    <button type="button" onClick={handlePlayPause} className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur" aria-label={isPlaying ? "توقف" : "پخش"}>{isPlaying ? <Pause size={30} /> : <Play size={30} className="mr-1 fill-current" />}</button>
                                    <button type="button" onClick={() => seekTo(currentTime + 10)} className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur" aria-label="۱۰ ثانیه جلو"><FastForward size={22} /></button>
                                </div>
                                <div className="lesson-video-controls absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/88 via-black/48 to-transparent px-3 pb-2 pt-7">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/82" dir="ltr">
                                        <span className="w-9 text-left">{formatTime(currentTime)}</span>
                                        <input type="range" min={0} max={duration || 100} value={Math.min(currentTime, duration || 100)} onChange={(event) => seekTo(Number(event.target.value))} className="lesson-video-range h-5 flex-1" aria-label="جابه‌جایی ویدئو" />
                                        <span className="w-9 text-right">{formatTime(duration)}</span>
                                        <button type="button" onClick={toggleFullscreen} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur" aria-label="تمام صفحه">{isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <Surface as="section" className="rounded-[24px] border-[#dfe6f0] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-none">
                    {playback && playback.subtitles.length > 1 && (
                        <label className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
                            زبان زیرنویس
                            <select value={selectedTrack?.language || ""} onChange={(event) => setSelectedLanguage(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold" aria-label="زبان زیرنویس">
                                {playback.subtitles.map((track) => <option key={track.id} value={track.language}>{LANGUAGE_LABELS[track.language] || track.language.toUpperCase()}</option>)}
                            </select>
                        </label>
                    )}
                    {selectedTrack && (
                        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-500" aria-label="کیفیت زیرنویس">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">همگام‌سازی تأییدشده</span>
                            {selectedTrack.qualityScore !== null && <span>امتیاز کیفیت: {Math.round(selectedTrack.qualityScore)}٪</span>}
                            {selectedTrack.qualityWarnings.length > 0 && <span className="text-amber-700">{selectedTrack.qualityWarnings.length} هشدار غیرمسدودکننده</span>}
                        </div>
                    )}
                    <div ref={subtitleListRef} className="lesson-subtitle-card lesson-subtitle-list no-scrollbar h-[calc(100dvh-430px)] min-h-[260px] max-h-[390px] overflow-y-auto rounded-[20px] border border-[#dfe6f0] bg-[#f8fbff] px-3 py-3">
                        {syncedTranscript.length === 0 ? (
                            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-bold leading-7 text-slate-400">برای این درس زیرنویس منتشرشده‌ای وجود ندارد.</div>
                        ) : syncedTranscript.map((item, index) => {
                            const active = index === activeSubtitleIndex;
                            return (
                                <button
                                    key={`${selectedTrack?.id || 0}-${item.id}`}
                                    ref={(element) => { if (active) activeSubtitleRef.current = element; }}
                                    type="button"
                                    onClick={() => seekTo(item.start + 0.02)}
                                    className={cn("lesson-subtitle-row block w-full rounded-[16px] px-3 py-3 text-center transition-all duration-300", active ? "bg-white opacity-100 shadow-sm ring-1 ring-[#d5e1ef]" : "opacity-65 hover:bg-white/70 hover:opacity-100")}
                                    aria-label={`رفتن به ${formatTime(item.start)}`}
                                >
                                    {showChineseText && item.chinese && <p className={cn("font-cjk text-[16px] font-black leading-8", active ? "text-[#155aa6]" : "text-slate-700")} dir="ltr" lang="zh-CN">{renderChineseWithHighlights(item.chinese, item.highlightedWords)}</p>}
                                    {showPinyinText && item.pinyin && <p className={cn("font-latin text-[12px] font-bold leading-5", active ? "text-[#4d7fb7]" : "text-slate-400")} dir="ltr" lang="zh-Latn">{item.pinyin}</p>}
                                    {showTranslationText && item.translation && <p className={cn("mt-1 text-[15px] font-medium leading-8", active ? "text-slate-700" : "text-slate-500")}>{item.translation}</p>}
                                </button>
                            );
                        })}
                    </div>
                </Surface>

                <Surface as="section" className="rounded-[24px] border-[#dfe6f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-none">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0"><h2 className="text-base font-black text-slate-950">ادامهٔ دوره</h2><p className="mt-1 truncate text-xs font-medium text-slate-500" {...getDirectionalTextProps(course.title)}>{course.title}</p></div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{lessonIndex + 1}/{allLessons.length}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {previousLesson ? <Link href={`/watch/${encodeURIComponent(domain)}/${course.id}?lesson=${previousLesson.id}`} className="rounded-[18px] border border-[#dfe6f0] bg-white px-3 py-3 text-center text-xs font-black text-slate-600">درس قبلی</Link> : <span className="rounded-[18px] border border-[#dfe6f0] bg-slate-50 px-3 py-3 text-center text-xs font-black text-slate-300">درس قبلی</span>}
                        {nextLesson ? <Link href={`/watch/${encodeURIComponent(domain)}/${course.id}?lesson=${nextLesson.id}`} className="rounded-[18px] bg-[#155aa6] px-3 py-3 text-center text-xs font-black text-white">درس بعدی</Link> : <span className="rounded-[18px] bg-slate-100 px-3 py-3 text-center text-xs font-black text-slate-400">پایان دوره</span>}
                    </div>
                </Surface>
            </main>

            {selectedWord && <VocabularyModal key={selectedWord.id} word={selectedWord} isOpen={showVocabModal} onClose={() => { setShowVocabModal(false); resumeVideoAfterVocabulary(); }} />}
            {vocabularyError && <button type="button" onClick={() => setVocabularyError(null)} className="fixed bottom-24 left-1/2 z-[950] w-[min(360px,calc(100%-32px))] -translate-x-1/2 rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-bold leading-5 text-red-600 shadow-lg" role="alert">{vocabularyError}</button>}
        </div>
    );
}
