"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MoreVertical } from "lucide-react";
import { useParams } from "next/navigation";

export default function LessonPlayerPage() {
    const params = useParams();
    const id = params?.id;

    return (
        <div className="min-h-full bg-white flex flex-col" dir="rtl">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="#" onClick={() => window.history.back()} className="text-gray-600">
                        <ArrowRight size={24} />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-800">درس {id}</h1>
                </div>
                <button className="text-gray-600">
                    <MoreVertical size={24} />
                </button>
            </header>

            {/* Video Player */}
            <div className="w-full aspect-video bg-black sticky top-[52px] z-20">
                <video
                    controls
                    className="w-full h-full"
                    poster="/placeholder_video_poster.jpg"
                >
                    <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Content Below Video */}
            <div className="flex-1 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2" dir="ltr">你好！</h2>
                <p className="text-gray-500 text-sm mb-6" dir="ltr">Hello! - Lesson {id}</p>

                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-2">Key Vocabulary</h3>
                        <ul className="space-y-2 text-sm text-gray-700" dir="ltr">
                            <li className="flex justify-between">
                                <span>你好 (nǐ hǎo)</span>
                                <span className="text-gray-500">Hello</span>
                            </li>
                            <li className="flex justify-between">
                                <span>谢谢 (xiè xie)</span>
                                <span className="text-gray-500">Thank you</span>
                            </li>
                        </ul>
                    </div>

                    <p className="text-gray-600 leading-relaxed text-justify">
                        In this lesson, we will learn the basic greetings in Chinese.
                        &quot;Ni hao&quot; is the most common way to say hello.
                    </p>
                </div>
            </div>
        </div>
    );
}
