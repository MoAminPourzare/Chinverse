"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, MoreVertical, Rewind, FastForward, Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";

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

// Sample transcript data with Chinese, Pinyin, and translations
const sampleTranscript = [
    {
        id: 1,
        chinese: "今天和我一起学习HSK第三级，第一课。",
        pinyin: "Jīntiān hé wǒ yīqǐ xuéxí HSK dì sān jí, dì yī kè.",
        persian: "به دوره‌ی استاندارد HSK سطح ۳ / ۳۰ درس / خوش آمدی.",
        english: "Welcome to HSK Standard Course Level 3, Lesson 30."
    },
    {
        id: 2,
        chinese: "首先我们一起读一下标题吧。",
        pinyin: "Shǒuxiān wǒmen yīqǐ dú yīxià biāotí ba.",
        persian: "اول با هم عنوان درس رو بخونیم.",
        english: "Let's read the title."
    },
    {
        id: 3,
        chinese: "周末你有什么打算？",
        pinyin: "Zhōumò nǐ yǒu shénme dǎsuàn?",
        persian: "آخر هفته چه برنامه‌ای داری؟",
        english: "What's your plan for the weekend?"
    },
    {
        id: 4,
        chinese: "周末你有什么打算？",
        pinyin: "Zhōumò nǐ yǒu shénme dǎsuàn?",
        persian: "(تکرار) آخر هفته چه برنامه‌ای داری؟",
        english: "(Repeat) What's your plan for the weekend?"
    },
];

export default function CourseWatchPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const courseId = params?.id;
    const lessonIdParam = searchParams.get('lesson');

    const [course, setCourse] = useState<Course | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

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
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
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
    const allLessons = course.sections?.flatMap(s => s.lessons) || [];
    const lessonIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    const lessonNumber = lessonIndex + 1;

    // Chinese lesson title
    const chineseTitles: Record<number, string> = {
        1: "周末你有什么打算？",
        2: "他什么时候回来？",
        3: "桌子上放着很多饮料。",
    };
    const chineseTitle = chineseTitles[lessonNumber] || "你好！";
    const persianLessonNames = ["اول", "دوم", "سوم", "چهارم", "پنجم"];
    const persianLessonName = persianLessonNames[lessonNumber - 1] || `${lessonNumber}`;

    return (
        <div className="min-h-full bg-white flex flex-col" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href={`/courses/${courseId}/lessons`} className="text-gray-600">
                    <X size={24} />
                </Link>
                <div className="flex-1 text-center">
                    <h1 className="text-base font-bold text-gray-900">درس {persianLessonName}</h1>
                    <p className="text-xs text-gray-500" dir="ltr">{chineseTitle}</p>
                </div>
                <button className="text-gray-600">
                    <MoreVertical size={22} />
                </button>
            </header>

            {/* Video Player */}
            <div className="w-full aspect-video bg-black relative">
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
                        <div key={item.id} className="space-y-2">
                            {/* Chinese with highlighted words */}
                            <p className="text-xl font-bold text-gray-900" dir="ltr">
                                {item.chinese.split(/(\S+)/).map((word, idx) => (
                                    <span
                                        key={idx}
                                        className={word.includes('HSK') || word.includes('第') ? 'bg-red-100 text-red-600 px-1 rounded' : ''}
                                    >
                                        {word}
                                    </span>
                                ))}
                            </p>

                            {/* Pinyin - now with improved formatting */}
                            {item.pinyin && (
                                <p className="text-sm text-gray-500" dir="ltr">
                                    {item.pinyin}
                                </p>
                            )}

                            {/* Persian Translation */}
                            <p className="text-gray-700 text-sm leading-relaxed">
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
        </div>
    );
}
