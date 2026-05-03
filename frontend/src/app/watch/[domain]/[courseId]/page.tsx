"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, MoreVertical, Rewind, FastForward, Play, Pause, SkipForward, RotateCcw, Maximize } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import VocabularyModal from "@/components/lms/VocabularyModal";
import { lessonChineseTitles, persianNumbers } from "@/lib/videoUtils";

interface Lesson {
    id: number;
    title: string;
    video_url: string;
}

interface Section {
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

// Domain-specific configuration
const domainConfig: Record<string, { label: string; color: string; backPath: (courseId: string) => string }> = {
    hsk: {
        label: "HSK",
        color: "text-blue-600",
        backPath: (courseId) => `/hsk/${courseId}`,
    },
    pronunciation: {
        label: "تلفظ",
        color: "text-purple-600",
        backPath: (courseId) => `/pronunciation/${courseId}`,
    },
    characters: {
        label: "کاراکتر",
        color: "text-indigo-600",
        backPath: (courseId) => `/characters/${courseId}`,
    },
    series: {
        label: "سریال",
        color: "text-rose-600",
        backPath: (courseId) => `/series/${courseId}`,
    },
    movies: {
        label: "فیلم",
        color: "text-red-600",
        backPath: (courseId) => `/movies/${courseId}`,
    },
    cartoons: {
        label: "انیمیشن",
        color: "text-purple-600",
        backPath: (courseId) => `/cartoons/${courseId}`,
    },
    music: {
        label: "موسیقی",
        color: "text-teal-600",
        backPath: (courseId) => `/music/${courseId}`,
    },
    grammar: {
        label: "گرامر",
        color: "text-emerald-600",
        backPath: (courseId) => `/grammar/${courseId}`,
    },
    idioms: {
        label: "اصطلاحات",
        color: "text-rose-600",
        backPath: (courseId) => `/idioms/${courseId}`,
    },
    cooking: {
        label: "آشپزی",
        color: "text-orange-600",
        backPath: (courseId) => `/cooking/${courseId}`,
    },
    podcasts: {
        label: "پادکست",
        color: "text-indigo-600",
        backPath: (courseId) => `/podcasts/${courseId}`,
    },
    reality: {
        label: "ریالیتی شو",
        color: "text-pink-600",
        backPath: (courseId) => `/reality/${courseId}`,
    },
};

// Sample transcript data with highlighted words
const sampleTranscript = [
    {
        id: 1,
        chinese: "今天和我一起学习HSK第三级，第一课。",
        persian: "امروز با من HSK سطح سوم، درس اول رو یاد بگیرید.",
        highlightedWords: ["学习", "第三级"]
    },
    {
        id: 2,
        chinese: "周末你有什么打算？",
        persian: "آخر هفته چه برنامه‌ای داری؟",
        highlightedWords: ["周末", "打算"]
    },
    {
        id: 3,
        chinese: "我打算和朋友一起去旅游。",
        persian: "قصد دارم با دوستم برم مسافرت.",
        highlightedWords: ["打算", "旅游"]
    },
    {
        id: 4,
        chinese: "你打算什么时候出发？",
        persian: "قصد داری کِی حرکت کنی؟",
        highlightedWords: ["打算", "出发"]
    },
    {
        id: 5,
        chinese: "好，首先我们来看热身。",
        persian: "خیله خب، اول بریم سراغ گرم‌کردن (Warm-up).",
        highlightedWords: ["热身"]
    },
];

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

                // Get specific lesson or first lesson
                const allLessons = courseData.sections?.flatMap((s: Section) => s.lessons) || [];
                if (lessonIdParam) {
                    const lesson = allLessons.find((l: Lesson) => l.id === parseInt(lessonIdParam));
                    setCurrentLesson(lesson || allLessons[0]);
                } else if (allLessons[0]) {
                    setCurrentLesson(allLessons[0]);
                }
            } catch (error) {
                console.error("Failed to fetch course:", error);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId, lessonIdParam]);

    // Fullscreen change listener
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
            // Show mock data on error
            setSelectedWord({
                id: 0,
                chinese: word,
                pinyin: "dǎ suàn",
                persian_meaning: "قصد داشتن، خواستن",
                chinese_meaning: "1. 关于行动的方向、方法等的想法；念头\n2. 考虑；计划",
                composition: "打算盘\n另有打算",
                examples: [
                    { id: 1, zh_text: `他${word}当医生`, pinyin: "Tā dǎsuàn dāng yīshēng", target_text: "او قصد دارد پزشک شود" },
                    { id: 2, zh_text: `各有各的${word}`, pinyin: "Gè yǒu gè de dǎsuàn", target_text: "هر کسی برنامه خودش را دارد" },
                    { id: 3, zh_text: `为自己作${word}`, pinyin: "Wèi zìjǐ zuò dǎsuàn", target_text: "برای خودش برنامه‌ریزی کردن" },
                ],
            });
            setShowVocabModal(true);
        }
    };

    // Render Chinese text with highlighted clickable words
    const renderChineseWithHighlights = (text: string, highlightedWords: string[]) => {
        let result: React.ReactNode[] = [];
        let remainingText = text;
        let key = 0;

        while (remainingText.length > 0) {
            let foundWord: string | null = null;
            let foundIndex = -1;

            // Find the first highlighted word in remaining text
            for (const word of highlightedWords) {
                const index = remainingText.indexOf(word);
                if (index !== -1 && (foundIndex === -1 || index < foundIndex)) {
                    foundWord = word;
                    foundIndex = index;
                }
            }

            if (foundWord && foundIndex !== -1) {
                // Add text before the highlighted word
                if (foundIndex > 0) {
                    result.push(<span key={key++}>{remainingText.slice(0, foundIndex)}</span>);
                }
                // Add the highlighted word
                const clickWord = foundWord;
                result.push(
                    <button
                        key={key++}
                        onClick={() => handleWordClick(clickWord)}
                        className="bg-orange-200 text-orange-800 px-1 rounded hover:bg-orange-300 transition-colors"
                    >
                        {foundWord}
                    </button>
                );
                remainingText = remainingText.slice(foundIndex + foundWord.length);
            } else {
                // No more highlighted words, add remaining text
                result.push(<span key={key++}>{remainingText}</span>);
                break;
            }
        }

        return result;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!course || !currentLesson) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">محتوا یافت نشد</div>
            </div>
        );
    }

    // Get lesson index
    const allLessons = course.sections?.flatMap((s) => s.lessons) || [];
    const lessonIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
    const lessonNumber = lessonIndex + 1;

    // Domain-aware title generation
    const entertainmentDomains = ["series", "movies", "cartoons", "music", "cooking", "podcasts", "reality"];
    const isEntertainment = entertainmentDomains.includes(domain);
    const isMusic = domain === "music";
    const chineseTitle = lessonChineseTitles[lessonNumber] || "你好！";
    const persianLessonName = persianNumbers[lessonNumber - 1] || `${lessonNumber}`;

    // Header title varies per domain
    const headerTitle = isMusic
        ? `آهنگ ${persianLessonName}`
        : isEntertainment
            ? `قسمت ${persianLessonName}`
            : `درس ${persianLessonName}`;
    const headerSubtitle = isEntertainment ? `${course.title} - ${isMusic ? "Track" : "EP"} ${lessonNumber}` : chineseTitle;

    return (
        <div className="min-h-full bg-white flex flex-col" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href={config.backPath(courseId)} className="text-gray-600">
                    <X size={24} />
                </Link>
                <div className="flex-1 text-center">
                    <h1 className={`text-base font-bold text-gray-900`}>{headerTitle}</h1>
                    <p className="text-xs text-gray-500" dir="ltr">{headerSubtitle}</p>
                </div>
                <button className="text-gray-600">
                    <MoreVertical size={22} />
                </button>
            </header>

            {/* Video Player */}
            <div ref={videoContainerRef} className="w-full aspect-video bg-black relative">
                <video
                    ref={videoRef}
                    className="w-full h-full"
                    src={currentLesson.video_url || "https://www.w3schools.com/html/mov_bbb.mp4"}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                >
                    Your browser does not support the video tag.
                </video>

                {/* Video Controls Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-8">
                    <button
                        onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                        className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white"
                    >
                        <Rewind size={32} />
                    </button>
                    <button
                        onClick={handlePlayPause}
                        className="w-16 h-16 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30"
                    >
                        {isPlaying ? <Pause size={36} /> : <Play size={36} className="mr-1" />}
                    </button>
                    <button
                        onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                        className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white"
                    >
                        <FastForward size={32} />
                    </button>
                </div>

                {/* Fullscreen Button */}
                <button
                    onClick={toggleFullscreen}
                    className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                >
                    <Maximize size={20} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-white px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-1 accent-blue-600"
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Transcript Section */}
            <div className="flex-1 overflow-y-auto px-4 py-6 bg-white">
                <div className="space-y-6">
                    {sampleTranscript.map((item) => (
                        <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0">
                            {/* Chinese Characters with Highlighted Words */}
                            <p className="text-xl font-bold text-blue-600 mb-3" dir="ltr">
                                {renderChineseWithHighlights(item.chinese, item.highlightedWords)}
                            </p>

                            {/* Persian Translation - RTL */}
                            <p className="text-gray-800 text-base leading-relaxed text-right">
                                {item.persian}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Player Controls */}
            <div className="bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-center gap-8">
                <button className="text-gray-600 hover:text-gray-800">
                    <RotateCcw size={24} />
                </button>
                <button
                    onClick={handlePlayPause}
                    className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-200"
                >
                    {isPlaying ? <Pause size={28} /> : <SkipForward size={28} />}
                </button>
                <button className="text-gray-600 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </button>
            </div>

            {/* Vocabulary Modal */}
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
