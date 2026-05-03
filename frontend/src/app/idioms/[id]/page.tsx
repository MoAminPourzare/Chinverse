"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Bookmark, MoreVertical, CheckCircle, Play } from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Course } from "@/lib/types";
import { getVideoThumbnail } from "@/lib/videoUtils";

// ==================== MOCK DATA ====================
const mockIdiomsCourses: Record<number, Course> = {
    801: {
        id: 801,
        title: "Everyday Chengyu",
        description: "مجموعه‌ای از ضرب‌المثل‌های چینی (成语) که در زندگی روزمره پرکاربرد هستند. هر درس یک ضرب‌المثل را با داستان پشت آن، معنا، و نحوه استفاده در مکالمه توضیح می‌دهد.",
        cover_image_url: "https://randomuser.me/api/portraits/women/40.jpg",
        level: "Intermediate",
        category: "idioms",
        sections: [{
            id: 1,
            title: "Common Chengyu",
            lessons: [
                { id: 8001, title: "一石二鸟 (yī shí èr niǎo) - Kill Two Birds", duration_minutes: 10, is_free: true },
                { id: 8002, title: "画蛇添足 (huà shé tiān zú) - Gild the Lily", duration_minutes: 12, is_free: true },
                { id: 8003, title: "守株待兔 (shǒu zhū dài tù) - Wait by the Tree", duration_minutes: 14, is_free: false },
                { id: 8004, title: "掩耳盗铃 (yǎn ěr dào líng) - Steal the Bell", duration_minutes: 11, is_free: false },
                { id: 8005, title: "对牛弹琴 (duì niú tán qín) - Play to a Cow", duration_minutes: 13, is_free: false },
                { id: 8006, title: "亡羊补牢 (wáng yáng bǔ láo) - Mend the Fold", duration_minutes: 10, is_free: false },
            ]
        }]
    },
    802: {
        id: 802,
        title: "Historical Idioms",
        description: "اصطلاحات چهار‌حرفی چینی که ریشه در تاریخ و اسطوره‌های چین دارند. هر درس داستان تاریخی پشت اصطلاح را بازگو می‌کند و کاربرد آن را در زبان مدرن توضیح می‌دهد.",
        cover_image_url: "https://randomuser.me/api/portraits/men/45.jpg",
        level: "Advanced",
        category: "idioms",
        sections: [{
            id: 1,
            title: "Historical Stories",
            lessons: [
                { id: 8101, title: "卧薪尝胆 (wò xīn cháng dǎn) - Sleep on Firewood", duration_minutes: 16, is_free: true },
                { id: 8102, title: "破釜沉舟 (pò fǔ chén zhōu) - Burn the Boats", duration_minutes: 14, is_free: true },
                { id: 8103, title: "四面楚歌 (sì miàn chǔ gē) - Surrounded by Enemies", duration_minutes: 18, is_free: false },
                { id: 8104, title: "三顾茅庐 (sān gù máo lú) - Three Visits", duration_minutes: 15, is_free: false },
                { id: 8105, title: "草船借箭 (cǎo chuán jiè jiàn) - Borrow Arrows", duration_minutes: 20, is_free: false },
            ]
        }]
    },
    803: {
        id: 803,
        title: "HSK Chengyu Collection",
        description: "مجموعه ضرب‌المثل‌های چینی که در آزمون‌های HSK سطح ۴ تا ۶ ظاهر می‌شوند. مناسب برای آمادگی آزمون و تقویت دانش فرهنگی زبان.",
        cover_image_url: "https://randomuser.me/api/portraits/women/28.jpg",
        level: "HSK 4-6",
        category: "idioms",
        sections: [{
            id: 1,
            title: "HSK Idioms",
            lessons: [
                { id: 8201, title: "自相矛盾 (zì xiāng máo dùn) - Self-Contradiction", duration_minutes: 12, is_free: true },
                { id: 8202, title: "半途而废 (bàn tú ér fèi) - Give Up Halfway", duration_minutes: 10, is_free: true },
                { id: 8203, title: "爱不释手 (ài bù shì shǒu) - Can't Put Down", duration_minutes: 11, is_free: false },
                { id: 8204, title: "一举两得 (yī jǔ liǎng dé) - Two Gains at Once", duration_minutes: 9, is_free: false },
                { id: 8205, title: "不可思议 (bù kě sī yì) - Inconceivable", duration_minutes: 13, is_free: false },
                { id: 8206, title: "迫不及待 (pò bù jí dài) - Can't Wait", duration_minutes: 10, is_free: false },
                { id: 8207, title: "心不在焉 (xīn bù zài yān) - Absent-Minded", duration_minutes: 11, is_free: false },
            ]
        }]
    }
};

export default function IdiomsDetailPage() {
    const params = useParams();
    const id = params?.id;
    const courseId = typeof id === "string" ? parseInt(id) : 0;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons] = useState<number[]>([8001]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);
            } catch (error) {
                console.error("Failed to fetch idioms course:", error);
                if (courseId && mockIdiomsCourses[courseId]) {
                    setCourse(mockIdiomsCourses[courseId]);
                }
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCourse();
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

    const totalLessons = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.length || 0), 0
    ) || 0;
    const totalMinutes = course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.reduce((s, l) => s + (l.duration_minutes || 0), 0) || 0), 0
    ) || 0;
    const allLessons = course.sections?.flatMap((section) =>
        section.lessons?.map((lesson, lessonIndex) => ({
            ...lesson,
            globalIndex: lessonIndex + 1,
        })) || []
    ) || [];

    return (
        <div className="min-h-full bg-white relative" dir="rtl">
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <Link href="/explore/idioms" className="text-gray-600">
                    <ArrowRight size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <button className="text-gray-600"><Bookmark size={22} /></button>
                    <button className="text-gray-600"><MoreVertical size={22} /></button>
                </div>
            </header>

            <main className="px-6 py-4">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl border-4 border-white mb-4">
                        {course.cover_image_url ? (
                            <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center">
                                <span className="text-white text-3xl font-bold">{course.title[0]}</span>
                            </div>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">{course.title}</h1>
                    <p className="text-gray-500 text-sm text-center mb-2">آموزش اصطلاحات چینی | {totalLessons} درس</p>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} size={16} className={i <= 5 ? "text-orange-400 fill-orange-400" : "text-orange-400"} />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">(4.9)</span>
                    </div>
                </div>

                <div className="mb-6 bg-gray-50 rounded-2xl p-4">
                    <p className="text-gray-700 text-sm leading-relaxed text-justify">{course.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                        <div className="text-rose-600 text-lg font-bold">{totalLessons}</div>
                        <div className="text-xs text-gray-600">درس</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                        <div className="text-green-600 text-lg font-bold">{totalMinutes}</div>
                        <div className="text-xs text-gray-600">دقیقه</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <div className="text-amber-600 text-lg font-bold">{course.level}</div>
                        <div className="text-xs text-gray-600">سطح</div>
                    </div>
                </div>

                <div className="mb-24">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Play size={20} className="text-rose-600" />
                        فهرست ویدیوها
                    </h3>
                    <div className="space-y-3">
                        {allLessons.map((lesson, index) => {
                            const isCompleted = completedLessons.includes(lesson.id);
                            const progress = isCompleted ? 100 : (index === 0 ? 30 : 0);
                            const thumbnail = getVideoThumbnail(lesson.id);

                            return (
                                <Link
                                    key={lesson.id}
                                    href={`/watch/idioms/${course.id}?lesson=${lesson.id}`}
                                    className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 active:scale-[0.99] transition-transform hover:shadow-md"
                                >
                                    <div className="flex">
                                        <div className="w-32 h-24 bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                            <img src={thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                    <Play size={18} className="text-rose-600 fill-rose-600 ml-0.5" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                {lesson.duration_minutes}:00
                                            </div>
                                            {isCompleted && (
                                                <div className="absolute top-1 right-1">
                                                    <CheckCircle size={18} className="text-green-500 fill-green-500 bg-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-rose-600 font-medium">Lesson {index + 1}</span>
                                                {lesson.is_free && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">رایگان</span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1" dir="ltr">{lesson.title}</h4>
                                            {progress > 0 && (
                                                <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-rose-500'}`}
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
            </main>
        </div>
    );
}
