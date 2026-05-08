"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Maximize, Minimize, MoreVertical, Pause, Play, Rewind, FastForward, RotateCcw, SkipForward, X } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import VocabularyModal from "@/components/lms/VocabularyModal";
import { isHttpStatus } from "@/lib/http";
import { lessonChineseTitles, persianNumbers } from "@/lib/videoUtils";
import Surface from "@/components/ui/Surface";
import SectionHeader from "@/components/ui/SectionHeader";

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
}

const domainConfig: Record<string, { label: string; color: string; backPath: (courseId: string) => string }> = {
    hsk: { label: "HSK", color: "text-blue-600", backPath: (courseId) => `/hsk/${courseId}` },
    pronunciation: { label: "تلفظ", color: "text-purple-600", backPath: (courseId) => `/pronunciation/${courseId}` },
    characters: { label: "کاراکتر", color: "text-indigo-600", backPath: (courseId) => `/characters/${courseId}` },
    series: { label: "سریال", color: "text-rose-600", backPath: (courseId) => `/series/${courseId}` },
    movies: { label: "فیلم", color: "text-red-600", backPath: (courseId) => `/movies/${courseId}` },
    cartoons: { label: "انیمیشن", color: "text-purple-600", backPath: (courseId) => `/cartoons/${courseId}` },
    music: { label: "موسیقی", color: "text-teal-600", backPath: (courseId) => `/music/${courseId}` },
    grammar: { label: "گرامر", color: "text-emerald-600", backPath: (courseId) => `/grammar/${courseId}` },
    idioms: { label: "اصطلاحات", color: "text-rose-600", backPath: (courseId) => `/idioms/${courseId}` },
    practical: { label: "چینی کاربردی", color: "text-cyan-600", backPath: (courseId) => `/practical/${courseId}` },
    vlogs: { label: "یادگیری با ولاگ", color: "text-amber-600", backPath: (courseId) => `/vlogs/${courseId}` },
    synonyms: { label: "واژگان هم‌معنی", color: "text-sky-600", backPath: (courseId) => `/synonyms/${courseId}` },
    classical: { label: "زبان چینی کلاسیک", color: "text-slate-700", backPath: (courseId) => `/classical/${courseId}` },
    "arts-cooking": { label: "آشپزی", color: "text-orange-600", backPath: (courseId) => `/arts-cooking/${courseId}` },
    "martial-arts": { label: "هنرهای رزمی", color: "text-red-600", backPath: (courseId) => `/martial-arts/${courseId}` },
    "energy-health": { label: "تمرینات انرژی و سلامت", color: "text-emerald-600", backPath: (courseId) => `/energy-health/${courseId}` },
    calligraphy: { label: "خطاطی", color: "text-indigo-600", backPath: (courseId) => `/calligraphy/${courseId}` },
    "tea-culture": { label: "فرهنگ چای", color: "text-amber-700", backPath: (courseId) => `/tea-culture/${courseId}` },
    "culture-texts": { label: "متون کلاسیک آموزشی", color: "text-slate-700", backPath: (courseId) => `/culture-texts/${courseId}` },
    "historical-stories": { label: "داستان‌های تاریخی", color: "text-stone-600", backPath: (courseId) => `/historical-stories/${courseId}` },
    "classical-poetry": { label: "شعر و ادبیات کلاسیک", color: "text-violet-600", backPath: (courseId) => `/classical-poetry/${courseId}` },
    "festivals-customs": { label: "آیین‌ها و جشن‌ها", color: "text-fuchsia-600", backPath: (courseId) => `/festivals-customs/${courseId}` },
    cooking: { label: "آشپزی", color: "text-orange-600", backPath: (courseId) => `/cooking/${courseId}` },
    podcasts: { label: "پادکست", color: "text-indigo-600", backPath: (courseId) => `/podcasts/${courseId}` },
    reality: { label: "ریالیتی شو", color: "text-pink-600", backPath: (courseId) => `/reality/${courseId}` },
    "topic-talks": { label: "گفتارهای موضوعی", color: "text-fuchsia-600", backPath: (courseId) => `/topic-talks/${courseId}` },
};

const sampleTranscript = [
    { id: 1, chinese: "今天和我一起学习HSK第三级，第一课。", persian: "امروز با من HSK سطح سوم، درس اول را یاد بگیرید.", highlightedWords: ["学习", "第三级"] },
    { id: 2, chinese: "周末你有什么打算？", persian: "آخر هفته چه برنامه‌ای داری؟", highlightedWords: ["周末", "打算"] },
    { id: 3, chinese: "我打算和朋友一起去旅游。", persian: "قصد دارم با دوستم برم مسافرت.", highlightedWords: ["打算", "旅游"] },
    { id: 4, chinese: "你打算什么时候出发？", persian: "قصد داری کی حرکت کنی؟", highlightedWords: ["打算", "出发"] },
    { id: 5, chinese: "好，首先我们来看热身。", persian: "خیله خب، اول بریم سراغ گرم‌کردن.", highlightedWords: ["热身"] },
] as TranscriptEntry[];

const getMetaString = (meta: Record<string, unknown> | undefined, key: string, fallback = ""): string => {
    const value = meta?.[key];
    return typeof value === "string" ? value : fallback;
};

const getMetaArray = (meta: Record<string, unknown> | undefined, key: string): string[] => {
    const value = meta?.[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
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
            const chinese = typeof entry.chinese === "string" ? entry.chinese : "";
            const persian = typeof entry.persian === "string" ? entry.persian : "";
            if (!chinese && !persian) {
                return null;
            }

            const highlightedWords = Array.isArray(entry.highlightedWords)
                ? entry.highlightedWords.filter((word): word is string => typeof word === "string")
                : [];

            return {
                id: typeof entry.id === "number" ? entry.id : index + 1,
                chinese,
                persian,
                highlightedWords,
            };
        })
        .filter((item): item is TranscriptEntry => Boolean(item));
};

export default function SharedWatchPage() {
    const params = useParams();
    const searchParams = useSearchParams();

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
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
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
                        onClick={() => handleWordClick(clickWord)}
                        className="rounded-md bg-amber-200 px-1.5 text-slate-900 transition-colors hover:bg-amber-300"
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

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
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
    const chineseTitle = lessonChineseTitles[lessonNumber] || "你好！";
    const persianLessonName = persianNumbers[lessonNumber - 1] || `${lessonNumber}`;
    const headerTitle = isMusic ? `آهنگ ${persianLessonName}` : isEntertainment ? `قسمت ${persianLessonName}` : `درس ${persianLessonName}`;
    const lessonMeta = currentLesson.metadata_json || {};
    const lessonSummary = getMetaString(lessonMeta, "summary", "");
    const lessonSubtitle = getMetaString(lessonMeta, "subtitle", "");
    const lessonNotes = getMetaArray(lessonMeta, "key_points");
    const lessonTranscript = getTranscriptEntries(lessonMeta);
    const headerSubtitle = isEntertainment ? `${course.title} - ${isMusic ? "Track" : "EP"} ${lessonNumber}` : lessonSubtitle || chineseTitle;

    return (
        <div className="min-h-full pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
                <Surface className="sticky top-4 z-20 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <Link href={config.backPath(courseId)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                            <X size={20} />
                        </Link>
                        <div className="min-w-0 flex-1 text-center">
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${config.color}`}>{config.label}</p>
                            <h1 className="mt-1 truncate text-base font-bold text-slate-900">{headerTitle}</h1>
                            <p className="truncate text-xs text-slate-500" dir="ltr">
                                {headerSubtitle}
                            </p>
                        </div>
                        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </Surface>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_360px]">
                    <div className="space-y-5">
                        <Surface className="overflow-hidden">
                            <div ref={videoContainerRef} className="relative aspect-video bg-black">
                                <video
                                    ref={videoRef}
                                    className="h-full w-full object-cover"
                                    src={currentLesson.video_url || "https://www.w3schools.com/html/mov_bbb.mp4"}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                >
                                    Your browser does not support the video tag.
                                </video>

                                <div className="absolute inset-0 flex items-center justify-center gap-6 bg-gradient-to-t from-black/25 via-transparent to-black/10">
                                    <button
                                        onClick={() => {
                                            if (videoRef.current) videoRef.current.currentTime -= 10;
                                        }}
                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur transition-colors hover:bg-black/35"
                                    >
                                        <Rewind size={26} />
                                    </button>
                                    <button
                                        onClick={handlePlayPause}
                                        className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/30"
                                    >
                                        {isPlaying ? <Pause size={34} /> : <Play size={34} className="mr-1 fill-current" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (videoRef.current) videoRef.current.currentTime += 10;
                                        }}
                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur transition-colors hover:bg-black/35"
                                    >
                                        <FastForward size={26} />
                                    </button>
                                </div>

                                <button
                                    onClick={toggleFullscreen}
                                    className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/60"
                                >
                                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                                </button>
                            </div>
                        </Surface>

                        <Surface className="px-4 py-4">
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>{formatTime(currentTime)}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="h-1 flex-1 accent-rose-500"
                                />
                                <span>{formatTime(duration)}</span>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-5">
                                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                                    <RotateCcw size={20} />
                                </button>
                                <button
                                    onClick={handlePlayPause}
                                    className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800"
                                >
                                    {isPlaying ? <Pause size={24} /> : <SkipForward size={24} className="mr-0.5" />}
                                </button>
                                <button className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </Surface>

                        {(lessonSummary || lessonSubtitle || lessonNotes.length > 0) && (
                            <Surface className="p-5">
                                <SectionHeader title="اطلاعات درس" subtitle="چکیده، نکات مهم و توضیحات تکمیلی." />
                                <div className="mt-4 space-y-3">
                                    {lessonSubtitle && <p className="text-xs font-semibold text-rose-600">{lessonSubtitle}</p>}
                                    {lessonSummary && <p className="text-sm leading-8 text-slate-600">{lessonSummary}</p>}
                                    {lessonNotes.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {lessonNotes.map((note) => (
                                                <span key={note} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500">
                                                    {note}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Surface>
                        )}

                        <Surface className="p-5">
                            <SectionHeader title="متن درس" subtitle="روی واژه‌های مشخص‌شده بزن تا معنی‌شان را ببینی." />
                            <div className="mt-5 space-y-5">
                                {lessonTranscript.map((item) => (
                                    <div key={item.id} className="space-y-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <p className="text-xl font-bold leading-9 text-rose-600" dir="ltr">
                                            {renderChineseWithHighlights(item.chinese, item.highlightedWords)}
                                        </p>
                                        <p className="text-sm leading-8 text-slate-700">{item.persian}</p>
                                    </div>
                                ))}
                            </div>
                        </Surface>
                    </div>

                    <div className="space-y-5">
                        <Surface className="p-5">
                            <SectionHeader title="مرور course" subtitle={course.description} />
                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{course.level}</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{course.title}</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{allLessons.length} درس</span>
                            </div>
                        </Surface>

                        <Surface className="p-5">
                            <SectionHeader title="فهرست درس‌ها" subtitle="برای جابه‌جایی سریع بین درس‌ها." />
                            <div className="mt-4 space-y-3">
                                {course.sections?.map((section, sectionIndex) => (
                                    <div key={section.id || sectionIndex} className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{section.title}</p>
                                        <div className="space-y-2">
                                            {(section.lessons || []).map((lesson, index) => {
                                                const active = lesson.id === currentLesson.id;
                                                return (
                                                    <Link
                                                        key={lesson.id}
                                                        href={`/watch/${domain}/${course.id}?lesson=${lesson.id}`}
                                                        className={`flex items-center justify-between gap-3 rounded-[18px] border px-3 py-3 transition-all duration-200 ${
                                                            active
                                                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                                                        }`}
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold">{index + 1}. {lesson.title}</p>
                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                {lesson.duration_minutes ? `${lesson.duration_minutes} دقیقه` : "بدون زمان"}
                                                            </p>
                                                        </div>
                                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? "bg-rose-600 text-white" : "bg-white text-slate-400"}`}>
                                                            <Play size={14} className="fill-current" />
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Surface>
                    </div>
                </div>
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
