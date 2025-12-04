"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Share2, BookmarkPlus } from "lucide-react";
import { useParams } from "next/navigation";
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
    sections: Section[];
}

export default function CourseWatchPage() {
    const params = useParams();
    const courseId = params?.id;
    const [course, setCourse] = useState<Course | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [activeTab, setActiveTab] = useState<'transcript' | 'episodes'>('transcript');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${courseId}`);
                const courseData = response.data;
                setCourse(courseData);

                // Get first lesson
                if (courseData.sections?.[0]?.lessons?.[0]) {
                    const firstLesson = courseData.sections[0].lessons[0];
                    setCurrentLesson(firstLesson);
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
    }, [courseId]);

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

    const allLessons = course.sections.flatMap(section => section.lessons);

    return (
        <div className="min-h-full bg-white flex flex-col" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Link href="#" onClick={() => window.history.back()} className="text-gray-600 flex-shrink-0">
                        <ArrowRight size={24} />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-800 truncate">
                        {course.title}
                    </h1>
                </div>
            </header>

            {/* Video Player */}
            <div className="w-full aspect-video bg-black sticky top-[53px] z-10">
                <video
                    controls
                    className="w-full h-full"
                    autoPlay
                    src={currentLesson.video_url}
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gray-50">
                {/* Course Info */}
                <div className="bg-white p-4 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h2>
                    <p className="text-sm text-gray-500 mb-3">{currentLesson.title}</p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                            <Heart size={18} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">پسندیدن</span>
                        </button>
                        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                            <BookmarkPlus size={18} className="text-gray-600" />
                        </button>
                        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                            <Share2 size={18} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-gray-200 sticky top-[calc(53px+56.25vw)] z-10">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('transcript')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transcript'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            متن / توضیحات
                        </button>
                        <button
                            onClick={() => setActiveTab('episodes')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'episodes'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            قسمت‌ها ({allLessons.length})
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'transcript' ? (
                        <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-line font-serif">
                                {course.description}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allLessons.map((lesson, index) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => setCurrentLesson(lesson)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentLesson.id === lesson.id
                                            ? 'bg-blue-50 border-2 border-blue-200'
                                            : 'bg-white border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${currentLesson.id === lesson.id ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}>
                                        <span className={`text-sm font-bold ${currentLesson.id === lesson.id ? 'text-white' : 'text-gray-600'
                                            }`}>
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className={`font-medium ${currentLesson.id === lesson.id ? 'text-blue-900' : 'text-gray-900'
                                            }`}>
                                            {lesson.title}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
