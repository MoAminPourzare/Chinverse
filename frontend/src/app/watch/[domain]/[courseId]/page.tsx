"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Maximize, Minimize, MoreVertical, Pause, Play, Rewind, FastForward } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { cn } from "@/lib/cn";
import { isHttpStatus } from "@/lib/http";
import { getMediaUrl } from "@/lib/media";
import { persianNumbers } from "@/lib/videoUtils";
import { getDirectionalTextProps } from "@/lib/textDirection";
import {
    getHighlightStyle,
    useLearningPreferences,
} from "@/lib/learningPreferences";
import Surface from "@/components/ui/Surface";
import { BackButton } from "@/components/ui/IconButton";
import { dailyActivityService } from "@/services/dailyActivity.service";

const VocabularyModal = dynamic(() => import("@/components/lms/VocabularyModal"), {
    ssr: false,
});

interface Lesson {
    id: number;
    title: string;
    video_url: string;
    duration_minutes?: number;
    is_free?: boolean;
    metadata_json?: Record<string, unknown>;
}

interface Section {
    id?: number;
    title?: string;
    lessons: Lesson[];
    metadata_json?: Record<string, unknown>;
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

interface TranscriptEntry {
    id: number;
    chinese: string;
    persian: string;
    highlightedWords: string[];
    start: number;
    end: number;
}

const domainConfig: Record<string, { label: string; color: string; backPath: (courseId: string) => string }> = {
    hsk: { label: "HSK", color: "text-[#155aa6]", backPath: (courseId) => `/hsk/${courseId}` },
    pronunciation: { label: "تلفظ", color: "text-[#155aa6]", backPath: (courseId) => `/pronunciation/${courseId}` },
    characters: { label: "کاراکتر", color: "text-[#155aa6]", backPath: (courseId) => `/characters/${courseId}` },
    series: { label: "سریال", color: "text-[#155aa6]", backPath: (courseId) => `/series/${courseId}` },
    movies: { label: "فیلم", color: "text-[#155aa6]", backPath: (courseId) => `/movies/${courseId}` },
    cartoons: { label: "انیمیشن", color: "text-[#155aa6]", backPath: (courseId) => `/cartoons/${courseId}` },
    music: { label: "موسیقی", color: "text-[#155aa6]", backPath: (courseId) => `/music/${courseId}` },
    grammar: { label: "گرامر", color: "text-[#155aa6]", backPath: (courseId) => `/grammar/${courseId}` },
    idioms: { label: "اصطلاحات", color: "text-[#155aa6]", backPath: (courseId) => `/idioms/${courseId}` },
    practical: { label: "چینی کاربردی", color: "text-[#155aa6]", backPath: (courseId) => `/practical/${courseId}` },
    vlogs: { label: "یادگیری با ولاگ", color: "text-[#155aa6]", backPath: (courseId) => `/vlogs/${courseId}` },
    synonyms: { label: "واژگان هم‌معنی", color: "text-[#155aa6]", backPath: (courseId) => `/synonyms/${courseId}` },
    classical: { label: "زبان چینی کلاسیک", color: "text-[#155aa6]", backPath: (courseId) => `/classical/${courseId}` },
    "arts-cooking": { label: "آشپزی", color: "text-[#155aa6]", backPath: (courseId) => `/arts-cooking/${courseId}` },
    "martial-arts": { label: "هنرهای رزمی", color: "text-[#155aa6]", backPath: (courseId) => `/martial-arts/${courseId}` },
    "energy-health": { label: "تمرینات انرژی و سلامت", color: "text-[#155aa6]", backPath: (courseId) => `/energy-health/${courseId}` },
    calligraphy: { label: "خطاطی", color: "text-[#155aa6]", backPath: (courseId) => `/calligraphy/${courseId}` },
    "tea-culture": { label: "فرهنگ چای", color: "text-[#155aa6]", backPath: (courseId) => `/tea-culture/${courseId}` },
    "culture-texts": { label: "متون کلاسیک آموزشی", color: "text-[#155aa6]", backPath: (courseId) => `/culture-texts/${courseId}` },
    "historical-stories": { label: "داستان‌های تاریخی", color: "text-[#155aa6]", backPath: (courseId) => `/historical-stories/${courseId}` },
    "classical-poetry": { label: "شعر و ادبیات کلاسیک", color: "text-[#155aa6]", backPath: (courseId) => `/classical-poetry/${courseId}` },
    "festivals-customs": { label: "آیین‌ها و جشن‌ها", color: "text-[#155aa6]", backPath: (courseId) => `/festivals-customs/${courseId}` },
    cooking: { label: "آشپزی", color: "text-[#155aa6]", backPath: (courseId) => `/cooking/${courseId}` },
    podcasts: { label: "پادکست", color: "text-[#155aa6]", backPath: (courseId) => `/podcasts/${courseId}` },
    reality: { label: "ریالیتی شو", color: "text-[#155aa6]", backPath: (courseId) => `/reality/${courseId}` },
    "topic-talks": { label: "گفتارهای موضوعی", color: "text-[#155aa6]", backPath: (courseId) => `/topic-talks/${courseId}` },
};

const sampleTranscript: TranscriptEntry[] = [
    { id: 1, start: 0, end: 2.4, chinese: "大家好，今天我们练习一段中文听力。", persian: "سلام به همه، امروز یک بخش کوتاه شنیداری چینی تمرین می‌کنیم.", highlightedWords: ["练习", "听力"] },
    { id: 2, start: 2.4, end: 4.8, chinese: "请先听句子，然后看下面的翻译。", persian: "اول جمله را گوش کن، بعد ترجمه پایین را ببین.", highlightedWords: ["句子", "翻译"] },
    { id: 3, start: 4.8, end: 7.2, chinese: "如果有不认识的词，可以点一下。", persian: "اگر واژه‌ای را نمی‌شناسی، می‌توانی روی آن بزنی.", highlightedWords: ["认识", "词"] },
    { id: 4, start: 7.2, end: 9.6, chinese: "系统会跟着视频自动滚动。", persian: "سیستم همراه ویدیو به‌صورت خودکار اسکرول می‌کند.", highlightedWords: ["自动", "滚动"] },
    { id: 5, start: 9.6, end: 12.4, chinese: "你也可以拖动进度条，字幕会马上同步。", persian: "می‌توانی نوار زمان را هم جابه‌جا کنی؛ زیرنویس همان لحظه هماهنگ می‌شود.", highlightedWords: ["进度条", "字幕"] },
    { id: 6, start: 12.4, end: 15.5, chinese: "现在，我们继续看下一句。", persian: "حالا می‌رویم سراغ جمله بعدی.", highlightedWords: ["继续", "下一句"] },
] as TranscriptEntry[];

const getOptionalNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const getTranscriptEntries = (meta: Record<string, unknown> | undefined): TranscriptEntry[] => {
    const value = meta?.transcript;
    if (!Array.isArray(value) || value.length === 0) {
        return sampleTranscript;
    }

    return value
        .map((item, index) => {
            if (!item || typeof item !== "object") {
                return null;
            }

            const entry = item as Record<string, unknown>;
            const chinese = typeof entry.chinese === "string"
                ? entry.chinese
                : typeof entry.zh_text === "string"
                    ? entry.zh_text
                    : "";
            const persian = typeof entry.persian === "string"
                ? entry.persian
                : typeof entry.target_text === "string"
                    ? entry.target_text
                    : typeof entry.translation === "string"
                        ? entry.translation
                        : "";
            if (!chinese && !persian) {
                return null;
            }

            const highlightedWords = Array.isArray(entry.highlightedWords)
                ? entry.highlightedWords.filter((word): word is string => typeof word === "string")
                : [];
            const start = getOptionalNumber(entry.start) ?? getOptionalNumber(entry.start_time) ?? getOptionalNumber(entry.timestamp_start) ?? index * 4;
            const end = getOptionalNumber(entry.end) ?? getOptionalNumber(entry.end_time) ?? getOptionalNumber(entry.timestamp_end) ?? start + 4;

            return {
                id: typeof entry.id === "number" ? entry.id : index + 1,
                chinese,
                persian,
                highlightedWords,
                start,
                end: Math.max(end, start + 0.6),
            };
        })
        .filter((item): item is TranscriptEntry => Boolean(item))
        .sort((a, b) => a.start - b.start);
};

export default function SharedWatchPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { preferences } = useLearningPreferences();

    const domain = params?.domain as string;
    const courseId = params?.courseId as string;
    const lessonIdParam = searchParams.get("lesson");

    const config = domainConfig[domain] || domainConfig.hsk;

    const [course, setCourse] = useState<Course | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
    const [showVocabModal, setShowVocabModal] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const subtitleListRef = useRef<HTMLDivElement>(null);
    const activeSubtitleRef = useRef<HTMLDivElement | null>(null);
    const pendingWatchSecondsRef = useRef(0);
    const lastWatchTickRef = useRef<number | null>(null);
    const isFlushingWatchRef = useRef(false);
    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const lessonIdRef = useRef<number | null>(null);

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
        } catch (error) {
            console.error("Failed to record video progress", error);
        } finally {
            isFlushingWatchRef.current = false;
        }
    }, []);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${courseId}`);
                const courseData = response.data;
                setCourse(courseData);

                const allLessons = courseData.sections?.flatMap((s: Section) => s.lessons) || [];
                if (lessonIdParam) {
                    const lesson = allLessons.find((l: Lesson) => l.id === parseInt(lessonIdParam));
                    setCurrentLesson(lesson || allLessons[0]);
                } else if (allLessons[0]) {
                    setCurrentLesson(allLessons[0]);
                }
            } catch (error) {
                if (!isHttpStatus(error, 404)) {
                    console.error("Failed to fetch course:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId, lessonIdParam]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = preferences.playbackSpeed;
        }
    }, [preferences.playbackSpeed, currentLesson?.id]);

    useEffect(() => {
        lessonIdRef.current = currentLesson?.id || null;
        pendingWatchSecondsRef.current = 0;
        lastWatchTickRef.current = null;
        return () => {
            void flushWatchProgress(true);
        };
    }, [flushWatchProgress, currentLesson?.id]);

    useEffect(() => {
        if (!isPlaying || !currentLesson?.id) {
            lastWatchTickRef.current = null;
            return;
        }

        lastWatchTickRef.current = Date.now();
        const interval = window.setInterval(() => {
            const now = Date.now();
            const lastTick = lastWatchTickRef.current || now;
            const elapsedSeconds = Math.min(Math.max((now - lastTick) / 1000, 0), 2);
            pendingWatchSecondsRef.current += elapsedSeconds;
            lastWatchTickRef.current = now;

            if (pendingWatchSecondsRef.current >= 15) {
                void flushWatchProgress();
            }
        }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, [flushWatchProgress, isPlaying, currentLesson?.id]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                void flushWatchProgress(true);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            void flushWatchProgress(true);
        };
    }, [flushWatchProgress]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            currentTimeRef.current = videoRef.current.currentTime;
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            durationRef.current = videoRef.current.duration;
            videoRef.current.playbackRate = preferences.playbackSpeed;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
            currentTimeRef.current = time;
        }
    };

    const toggleFullscreen = async () => {
        if (!videoContainerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await videoContainerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error("Fullscreen error:", err);
        }
    };

    const handleWordClick = async (word: string) => {
        try {
            const response = await api.get(`/vocabulary/${encodeURIComponent(word)}`);
            setSelectedWord(response.data);
            setShowVocabModal(true);
        } catch (error) {
            console.error("Failed to fetch vocabulary:", error);
            setSelectedWord(null);
            setShowVocabModal(false);
        }
    };

    const renderChineseWithHighlights = (text: string, highlightedWords: string[]) => {
        const result: React.ReactNode[] = [];
        let remainingText = text;
        let key = 0;

        while (remainingText.length > 0) {
            let foundWord: string | null = null;
            let foundIndex = -1;

            for (const word of highlightedWords) {
                const index = remainingText.indexOf(word);
                if (index !== -1 && (foundIndex === -1 || index < foundIndex)) {
                    foundWord = word;
                    foundIndex = index;
                }
            }

            if (foundWord && foundIndex !== -1) {
                if (foundIndex > 0) {
                    result.push(<span key={key++}>{remainingText.slice(0, foundIndex)}</span>);
                }
                const clickWord = foundWord;
                result.push(
                    <button
                        key={key++}
                        onClick={(event) => {
                            event.stopPropagation();
                            void handleWordClick(clickWord);
                        }}
                        className="font-cjk px-1.5 transition brightness-100 hover:brightness-95"
                        style={getHighlightStyle(preferences.newWordHighlightColor)}
                        lang="zh-CN"
                    >
                        {foundWord}
                    </button>,
                );
                remainingText = remainingText.slice(foundIndex + foundWord.length);
            } else {
                result.push(<span key={key++}>{remainingText}</span>);
                break;
            }
        }

        return result;
    };

    const syncedTranscript = useMemo(
        () => getTranscriptEntries(currentLesson?.metadata_json),
        [currentLesson?.metadata_json],
    );

    const activeSubtitleIndex = useMemo(() => {
        if (!syncedTranscript.length) return -1;
        const exactIndex = syncedTranscript.findIndex((entry) => currentTime >= entry.start && currentTime < entry.end);
        if (exactIndex >= 0) return exactIndex;
        for (let index = syncedTranscript.length - 1; index >= 0; index -= 1) {
            if (currentTime >= syncedTranscript[index].start) return index;
        }
        return 0;
    }, [currentTime, syncedTranscript]);

    const activeSubtitle = activeSubtitleIndex >= 0 ? syncedTranscript[activeSubtitleIndex] : null;

    useEffect(() => {
        const subtitleList = subtitleListRef.current;
        const activeElement = activeSubtitleRef.current;
        if (!subtitleList || !activeElement || isFullscreen) return;

        const listRect = subtitleList.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        const nextScrollTop = subtitleList.scrollTop + activeRect.top - listRect.top - 8;

        subtitleList.scrollTo({
            top: Math.max(nextScrollTop, 0),
            behavior: "smooth",
        });
    }, [activeSubtitleIndex, isFullscreen]);

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#155aa6] border-t-transparent" />
                    <span>در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    if (!course || !currentLesson) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <div className="text-slate-500">محتوا یافت نشد</div>
            </div>
        );
    }

    const allLessons = course.sections?.flatMap((s) => s.lessons) || [];
    const lessonIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
    const lessonNumber = lessonIndex + 1;
    const entertainmentDomains = ["series", "movies", "cartoons", "music", "cooking", "podcasts", "reality", "topic-talks"];
    const isEntertainment = entertainmentDomains.includes(domain);
    const isMusic = domain === "music";
    const persianLessonName = persianNumbers[lessonNumber - 1] || `${lessonNumber}`;
    const headerTitle = isMusic ? `آهنگ ${persianLessonName}` : isEntertainment ? `قسمت ${persianLessonName}` : `درس ${persianLessonName}`;
    const lessonTranscript = syncedTranscript;
    const showChineseText = preferences.textDisplayMode !== "persian";
    const showPersianText = preferences.textDisplayMode !== "chinese";
    const previousLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson = lessonIndex >= 0 ? allLessons[lessonIndex + 1] : null;

    const handleVideoEnded = () => {
        setIsPlaying(false);
        void flushWatchProgress(true);

        if (!preferences.autoplayNext) return;

        const nextLesson = allLessons[lessonIndex + 1];
        if (nextLesson) {
            router.push(`/watch/${domain}/${course.id}?lesson=${nextLesson.id}`);
        }
    };

    const seekBy = (seconds: number) => {
        if (!videoRef.current) return;
        const nextTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration || Number.POSITIVE_INFINITY);
        videoRef.current.currentTime = nextTime;
        setCurrentTime(nextTime);
        currentTimeRef.current = nextTime;
    };

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 py-5">
                <header className="sticky top-0 z-20 -mx-4 bg-[#f7f8fa]/90 px-4 py-2 backdrop-blur">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        <BackButton href={config.backPath(courseId)} className="justify-self-end" />
                        <div className="min-w-0 flex-1 text-center">
                            <p className={`text-[11px] font-black ${config.color}`}>{config.label}</p>
                            <h1 className="truncate text-sm font-black text-slate-900">{headerTitle}</h1>
                        </div>
                        <Link
                            href="/settings/appearance"
                            aria-label="تنظیمات نمایش درس"
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-[#dfe6f0] transition hover:bg-[#eef6ff]"
                        >
                            <MoreVertical size={20} />
                        </Link>
                    </div>
                </header>

                <section className="shrink-0 overflow-hidden rounded-[24px] border border-[#dfe6f0] bg-white p-2 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                    <div ref={videoContainerRef} className="lesson-video-shell relative aspect-video overflow-hidden rounded-[22px] bg-black">
                        <video
                            ref={videoRef}
                            className="lesson-video-element h-full w-full object-contain"
                            src={getMediaUrl(currentLesson.video_url) || "https://www.w3schools.com/html/mov_bbb.mp4"}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => {
                                setIsPlaying(false);
                                void flushWatchProgress(true);
                            }}
                            onEnded={handleVideoEnded}
                            onClick={handlePlayPause}
                        >
                            Your browser does not support the video tag.
                        </video>

                        {activeSubtitle && (
                            <div className="lesson-fullscreen-captions" aria-hidden={!isFullscreen}>
                                {showPersianText && <div className="lesson-caption-top">{activeSubtitle.persian}</div>}
                                {showChineseText && (
                                    <div className="lesson-caption-bottom font-cjk" lang="zh-CN" dir="ltr">
                                        {renderChineseWithHighlights(activeSubtitle.chinese, activeSubtitle.highlightedWords)}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="lesson-video-center-controls pointer-events-none absolute inset-0 flex items-center justify-center gap-5 bg-gradient-to-t from-black/35 via-transparent to-black/10">
                            <button type="button" onClick={() => seekBy(-10)} className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55" aria-label="۱۰ ثانیه عقب">
                                <Rewind size={22} />
                            </button>
                            <button type="button" onClick={handlePlayPause} className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30" aria-label={isPlaying ? "توقف" : "پخش"}>
                                {isPlaying ? <Pause size={30} /> : <Play size={30} className="mr-1 fill-current" />}
                            </button>
                            <button type="button" onClick={() => seekBy(10)} className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55" aria-label="۱۰ ثانیه جلو">
                                <FastForward size={22} />
                            </button>
                        </div>

                        <div className="lesson-video-controls absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/88 via-black/48 to-transparent px-3 pb-2 pt-7">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/82" dir="ltr">
                                <span className="w-9 text-left">{formatTime(currentTime)}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="lesson-video-range h-5 flex-1"
                                    aria-label="جابه‌جایی ویدیو"
                                />
                                <span className="w-9 text-right">{formatTime(duration)}</span>
                                <button type="button" onClick={toggleFullscreen} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition hover:bg-white/22" aria-label="تمام صفحه">
                                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <Surface as="section" className="rounded-[24px] border-[#dfe6f0] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-none">
                    <div
                        ref={subtitleListRef}
                        className="lesson-subtitle-card lesson-subtitle-list no-scrollbar h-[calc(100dvh-430px)] min-h-[260px] max-h-[390px] overflow-y-auto rounded-[20px] border border-[#dfe6f0] bg-[#f8fbff] px-3 py-3"
                    >
                        {lessonTranscript.map((item, index) => {
                            const active = index === activeSubtitleIndex;
                            return (
                                <div
                                    key={item.id}
                                    ref={(element) => {
                                        if (active) activeSubtitleRef.current = element;
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        if (!videoRef.current) return;
                                        videoRef.current.currentTime = Math.max(item.start + 0.02, 0);
                                        setCurrentTime(videoRef.current.currentTime);
                                        currentTimeRef.current = videoRef.current.currentTime;
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key !== "Enter" && event.key !== " ") return;
                                        event.preventDefault();
                                        if (!videoRef.current) return;
                                        videoRef.current.currentTime = Math.max(item.start + 0.02, 0);
                                        setCurrentTime(videoRef.current.currentTime);
                                        currentTimeRef.current = videoRef.current.currentTime;
                                    }}
                                    className={cn(
                                        "lesson-subtitle-row cursor-pointer rounded-[16px] px-3 py-3 text-center transition-all duration-300",
                                        active ? "bg-white opacity-100 shadow-sm ring-1 ring-[#d5e1ef]" : "opacity-65 hover:bg-white/70 hover:opacity-100",
                                    )}
                                >
                                    {showChineseText && (
                                        <p
                                            className={cn("font-cjk text-[16px] font-black leading-8", active ? "text-[#155aa6]" : "text-slate-700")}
                                            dir="ltr"
                                            lang="zh-CN"
                                        >
                                            {renderChineseWithHighlights(item.chinese, item.highlightedWords)}
                                        </p>
                                    )}
                                    {showPersianText && (
                                        <p className={cn("mt-1 text-[15px] font-medium leading-8", active ? "text-slate-700" : "text-slate-500")}>
                                            {item.persian}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Surface>

                <Surface as="section" className="rounded-[24px] border-[#dfe6f0] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-none">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-base font-black text-slate-950">ادامه دوره</h2>
                            <p className="mt-1 truncate text-xs font-medium text-slate-500" {...getDirectionalTextProps(course.title)}>{course.title}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                            {lessonNumber}/{allLessons.length}
                        </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {previousLesson ? (
                            <Link
                                href={`/watch/${domain}/${course.id}?lesson=${previousLesson.id}`}
                                className="rounded-[18px] border border-[#dfe6f0] bg-white px-3 py-3 text-center text-xs font-black text-slate-600 transition hover:bg-[#eef6ff] hover:text-[#155aa6]"
                            >
                                درس قبلی
                            </Link>
                        ) : (
                            <span className="rounded-[18px] border border-[#dfe6f0] bg-slate-50 px-3 py-3 text-center text-xs font-black text-slate-300">
                                درس قبلی
                            </span>
                        )}
                        {nextLesson ? (
                            <Link
                                href={`/watch/${domain}/${course.id}?lesson=${nextLesson.id}`}
                                className="rounded-[18px] bg-[#155aa6] px-3 py-3 text-center text-xs font-black text-white shadow-[0_10px_24px_rgba(21,90,166,0.22)] transition hover:bg-[#0f4e92]"
                            >
                                درس بعدی
                            </Link>
                        ) : (
                            <span className="rounded-[18px] bg-slate-100 px-3 py-3 text-center text-xs font-black text-slate-400">
                                پایان دوره
                            </span>
                        )}
                    </div>
                </Surface>
            </main>

            {selectedWord && (
                <VocabularyModal
                    word={selectedWord}
                    isOpen={showVocabModal}
                    onClose={() => setShowVocabModal(false)}
                />
            )}
        </div>
    );
}
