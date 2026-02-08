"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, BookOpen, Bookmark, MoreVertical, CheckCircle, Play } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface Lesson {
    id: number;
    title: string;
    duration_minutes: number;
    is_free: boolean;
    video_url?: string;
}

interface Section {
    id: number;
    title: string;
    lessons: Lesson[];
}

interface Course {
    id: number;
    title: string;
    description: string;
    cover_image_url: string;
    level: string;
    sections: Section[];
    category?: string; // 'hsk' | 'pronunciation' | etc.
}

// ==================== MOCK DATA FOR PRONUNCIATION COURSES ====================
const mockPronunciationCourses: Record<number, Course> = {
    101: {
        id: 101,
        title: "Grace Mandarin",
        description: "آموزش کامل تلفظ زبان چینی با گریس. این دوره شامل آموزش پینین، چهار تُن، و تمام صداهای چینی است.",
        cover_image_url: "https://randomuser.me/api/portraits/women/44.jpg",
        level: "Beginner",
        category: "pronunciation",
        sections: [{
            id: 1,
            title: "Pinyin Basics",
            lessons: [
                { id: 1001, title: "Introduction to Pinyin", duration_minutes: 12, is_free: true },
                { id: 1002, title: "The Four Tones", duration_minutes: 15, is_free: true },
                { id: 1003, title: "Initial Consonants (Part 1)", duration_minutes: 18, is_free: false },
                { id: 1004, title: "Initial Consonants (Part 2)", duration_minutes: 16, is_free: false },
                { id: 1005, title: "Simple Vowels", duration_minutes: 14, is_free: false },
                { id: 1006, title: "Compound Vowels", duration_minutes: 17, is_free: false },
            ]
        }]
    },
    102: {
        id: 102,
        title: "Yoyo Chinese",
        description: "سری کامل آموزش تلفظ و پینین با یویو چاینیز. مناسب برای مبتدیان و کسانی که می‌خواهند تلفظ خود را بهبود ببخشند.",
        cover_image_url: "https://randomuser.me/api/portraits/women/68.jpg",
        level: "Beginner",
        category: "pronunciation",
        sections: [{
            id: 1,
            title: "Pinyin Course",
            lessons: [
                { id: 2001, title: "What is Pinyin?", duration_minutes: 8, is_free: true },
                { id: 2002, title: "The 4 Tones of Mandarin", duration_minutes: 12, is_free: true },
                { id: 2003, title: "Initials b, p, m, f", duration_minutes: 10, is_free: false },
                { id: 2004, title: "Initials d, t, n, l", duration_minutes: 11, is_free: false },
                { id: 2005, title: "Initials g, k, h", duration_minutes: 9, is_free: false },
                { id: 2006, title: "Initials j, q, x", duration_minutes: 13, is_free: false },
                { id: 2007, title: "Initials zh, ch, sh, r", duration_minutes: 14, is_free: false },
                { id: 2008, title: "Initials z, c, s", duration_minutes: 10, is_free: false },
                { id: 2009, title: "Simple Finals", duration_minutes: 12, is_free: false },
                { id: 2010, title: "Compound Finals", duration_minutes: 15, is_free: false },
            ]
        }]
    },
    103: {
        id: 103,
        title: "Yang Yang",
        description: "آموزش صداها و تُن‌های زبان چینی با یانگ یانگ. تمرکز ویژه بر تلفظ صحیح و طبیعی.",
        cover_image_url: "https://randomuser.me/api/portraits/women/32.jpg",
        level: "Intermediate",
        category: "pronunciation",
        sections: [{
            id: 1,
            title: "Tone Mastery",
            lessons: [
                { id: 3001, title: "Tone Pairs Practice", duration_minutes: 20, is_free: true },
                { id: 3002, title: "Third Tone Sandhi", duration_minutes: 15, is_free: true },
                { id: 3003, title: "Neutral Tone", duration_minutes: 12, is_free: false },
                { id: 3004, title: "Tone Changes with 不 and 一", duration_minutes: 14, is_free: false },
                { id: 3005, title: "Common Pronunciation Mistakes", duration_minutes: 18, is_free: false },
                { id: 3006, title: "Advanced Tone Practice", duration_minutes: 22, is_free: false },
                { id: 3007, title: "Listening & Shadowing", duration_minutes: 25, is_free: false },
                { id: 3008, title: "Final Review", duration_minutes: 16, is_free: false },
            ]
        }]
    }
};

// Sample Chinese titles for HSK lessons
const lessonChineseTitles: Record<number, string> = {
    1: "周末你有什么打算？",
    2: "他什么时候回来？",
    3: "桌子上放着很多饮料。",
    4: "她总是笑着跟客人说话。",
    5: "你去哪儿我就去哪儿",
    6: "除了这个还有别的吗？",
    7: "你看起来很高兴",
    8: "我听了三遍才听懂",
    9: "这个字怎么念？",
    10: "你把书放在桌子上",
    11: "我把作业做完了",
    12: "他被老师批评了",
};

// Persian lesson numbers
const persianNumbers = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم", "هشتم", "نهم", "دهم", "یازدهم", "دوازدهم"];

// Video thumbnails for pronunciation lessons
const getVideoThumbnail = (lessonId: number) => {
    const thumbnails = [
        "https://i.ytimg.com/vi/RuGmc662HDg/mqdefault.jpg",
        "https://i.ytimg.com/vi/3hLmDS179YE/mqdefault.jpg",
        "https://i.ytimg.com/vi/M7lc1UVf-VE/mqdefault.jpg",
        "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    ];
    return thumbnails[lessonId % thumbnails.length];
};

export default function CourseDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === 'string' ? parseInt(id) : 0;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons] = useState<number[]>([2001]); // Mock: first lesson completed

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);
            } catch (error) {
                console.error("Failed to fetch course from API:", error);

                // Fallback to mock data for Pronunciation courses
                if (courseId && mockPronunciationCourses[courseId]) {
                    setCourse(mockPronunciationCourses[courseId]);
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCourse();
        }
    }, [id, courseId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">دوره یافت نشد</div>
            </div>
        );
    }

    // Determine course type
    const isHSK = course.title.toLowerCase().includes('hsk') || course.level?.match(/^[1-6]$/);
    const isPronunciation = course.category === 'pronunciation' ||
        course.title.toLowerCase().includes('pinyin') ||
        course.title.toLowerCase().includes('yoyo') ||
        course.title.toLowerCase().includes('grace') ||
        course.title.toLowerCase().includes('yang');

    // Calculate totals
    const totalLessons = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.length || 0), 0
    ) || 0;
    const totalMinutes = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.reduce((s, l) => s + (l.duration_minutes || 0), 0) || 0), 0
    ) || 0;
    const totalHours = Math.round(totalMinutes / 60);

    // Flatten lessons
    const allLessons = course.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1
        })) || []
    ) || [];

    // Back link
    const backLink = isHSK ? "/explore/hsk" : isPronunciation ? "/explore/pronunciation" : "/explore";

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href={backLink} className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <button className="text-gray-600">
                        <Bookmark size={22} />
                    </button>
                    <button className="text-gray-600">
                        <MoreVertical size={22} />
                    </button>
                </div>
            </header>

            <main className="px-6 py-4">
                {/* ===================== TYPE A: HSK LAYOUT ===================== */}
                {isHSK && !isPronunciation && (
                    <>
                        {/* HSK Title */}
                        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1" dir="ltr">
                            HSK {course.level}
                        </h1>
                        <p className="text-gray-500 text-sm text-center mb-4">
                            یادگیری زبان چینی | {totalHours > 0 ? `${totalHours} ساعت` : `${totalMinutes} دقیقه`}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4].map((i) => (
                                    <Star key={i} size={18} className="text-orange-400 fill-orange-400" />
                                ))}
                                <Star size={18} className="text-orange-400" />
                            </div>
                            <span className="text-xs text-blue-600 underline">ثبت نظر</span>
                        </div>

                        {/* HSK Book Cover */}
                        <div className="flex justify-center mb-8">
                            <div className="w-48 h-64 rounded-xl overflow-hidden shadow-xl border-4 border-white relative bg-orange-500">
                                <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-orange-600 flex flex-col items-center justify-center p-4">
                                    <div className="bg-blue-900 text-white text-xs px-2 py-1 rounded mb-2">标准教程</div>
                                    <div className="text-white text-xs mb-1">STANDARD COURSE</div>
                                    <div className="text-white text-6xl font-bold mb-1" dir="ltr">HSK</div>
                                    <div className="text-white text-5xl font-bold">{course.level}</div>
                                </div>
                            </div>
                        </div>

                        {/* HSK Description */}
                        <div className="mb-8">
                            <p className="text-gray-700 text-sm leading-relaxed text-justify">
                                کتاب HSK Standard Course {course.level} یکی از کتاب‌های رسمی و معتبر برای آموزش زبان چینی است.
                            </p>
                        </div>

                        {/* HSK Lesson List */}
                        <div className="mb-24">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-blue-600" />
                                فهرست درس‌ها
                            </h3>
                            <div className="space-y-3">
                                {allLessons.map((lesson, index) => {
                                    const isCompleted = completedLessons.includes(lesson.id);
                                    const progress = isCompleted ? 100 : (index === 0 ? 60 : 0);
                                    const chineseTitle = lessonChineseTitles[index + 1] || "你好！";
                                    const persianTitle = persianNumbers[index] || `${index + 1}`;

                                    return (
                                        <Link
                                            key={lesson.id}
                                            href={`/courses/${course.id}/watch?lesson=${lesson.id}`}
                                            className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 active:scale-[0.99] transition-transform hover:shadow-md"
                                        >
                                            <div className="flex">
                                                <div className="flex-1 p-4">
                                                    <h4 className="font-bold text-gray-900 mb-1">درس {persianTitle}</h4>
                                                    <p className="text-gray-600 text-sm mb-2" dir="ltr">{chineseTitle}</p>
                                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-2">
                                                        <div className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        {isCompleted ? (
                                                            <><CheckCircle size={14} className="text-green-500" /><span className="text-green-600">تکمیل شده</span></>
                                                        ) : (
                                                            <span>{lesson.duration_minutes || 40} دقیقه</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-24 bg-gradient-to-b from-orange-400 to-orange-600 flex flex-col items-center justify-center p-2 text-white">
                                                    <div className="text-base font-bold" dir="ltr">HSK</div>
                                                    <div className="text-xl font-bold" dir="ltr">{course.level}</div>
                                                    <div className="mt-1 bg-red-600 text-[8px] px-1.5 py-0.5 rounded">第 {index + 1} 课</div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* ===================== TYPE B: PRONUNCIATION LAYOUT ===================== */}
                {isPronunciation && (
                    <>
                        {/* Instructor Image + Title */}
                        <div className="flex flex-col items-center mb-6">
                            {/* Instructor Avatar */}
                            <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl border-4 border-white mb-4">
                                {course.cover_image_url ? (
                                    <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                        <span className="text-white text-3xl font-bold">{course.title[0]}</span>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
                                {course.title}
                            </h1>
                            <p className="text-gray-500 text-sm text-center mb-2">
                                آموزش تلفظ چینی | {totalLessons} درس
                            </p>

                            {/* Rating */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} size={16} className={i <= 4 ? "text-orange-400 fill-orange-400" : "text-orange-400"} />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-500">(4.8)</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6 bg-gray-50 rounded-2xl p-4">
                            <p className="text-gray-700 text-sm leading-relaxed text-justify">
                                {course.description}
                            </p>
                        </div>

                        {/* Course Info */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                                <div className="text-blue-600 text-lg font-bold">{totalLessons}</div>
                                <div className="text-xs text-gray-600">درس</div>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3 text-center">
                                <div className="text-green-600 text-lg font-bold">{totalMinutes}</div>
                                <div className="text-xs text-gray-600">دقیقه</div>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-3 text-center">
                                <div className="text-purple-600 text-lg font-bold">{course.level}</div>
                                <div className="text-xs text-gray-600">سطح</div>
                            </div>
                        </div>

                        {/* Lesson List with Thumbnails */}
                        <div className="mb-24">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Play size={20} className="text-blue-600" />
                                فهرست ویدیوها
                            </h3>

                            <div className="space-y-3">
                                {allLessons.map((lesson, index) => {
                                    const isCompleted = completedLessons.includes(lesson.id);
                                    const progress = isCompleted ? 100 : (index === 0 ? 45 : 0);
                                    const thumbnail = getVideoThumbnail(lesson.id);

                                    return (
                                        <Link
                                            key={lesson.id}
                                            href={`/courses/${course.id}/watch?lesson=${lesson.id}`}
                                            className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 active:scale-[0.99] transition-transform hover:shadow-md"
                                        >
                                            <div className="flex">
                                                {/* Thumbnail */}
                                                <div className="w-32 h-24 bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                                    <img
                                                        src={thumbnail}
                                                        alt={lesson.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Play Overlay */}
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30">
                                                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                            <Play size={18} className="text-blue-600 fill-blue-600 ml-0.5" />
                                                        </div>
                                                    </div>
                                                    {/* Duration Badge */}
                                                    <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                        {lesson.duration_minutes}:00
                                                    </div>
                                                    {/* Completed Badge */}
                                                    {isCompleted && (
                                                        <div className="absolute top-1 right-1">
                                                            <CheckCircle size={18} className="text-green-500 fill-green-500 bg-white rounded-full" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 p-3 flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-blue-600 font-medium">Lesson {index + 1}</span>
                                                        {lesson.is_free && (
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">رایگان</span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1" dir="ltr">
                                                        {lesson.title}
                                                    </h4>

                                                    {/* Progress Bar */}
                                                    {progress > 0 && (
                                                        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-1">
                                                            <div
                                                                className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
