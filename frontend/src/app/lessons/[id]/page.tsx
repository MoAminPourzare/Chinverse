"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BookOpenText, MoreVertical } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { BackButton } from "@/components/ui/IconButton";
import { getChineseTextStyle, getPersianTextStyle, useLearningPreferences } from "@/lib/learningPreferences";

export default function LessonPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const { preferences } = useLearningPreferences();
    const videoRef = useRef<HTMLVideoElement>(null);
    const id = params?.id;
    const chineseTextStyle = getChineseTextStyle(preferences);
    const persianTextStyle = getPersianTextStyle(preferences);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = preferences.playbackSpeed;
        }
    }, [preferences.playbackSpeed]);

    return (
        <div className="flex min-h-full flex-col bg-[#f7f8fa] px-4 pb-5 pt-4" dir="rtl">
            <header className="grid shrink-0 grid-cols-[40px_1fr_40px] items-center gap-3">
                <BackButton onClick={() => router.back()} className="justify-self-end" />
                <div className="min-w-0 flex-1 text-center">
                    <h1 className="truncate text-base font-black text-slate-900">درس {id}</h1>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">پخش و تمرین درس</p>
                </div>
                <Link href="/settings/appearance" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-[#dfe6f0] transition hover:bg-[#eef6ff]" aria-label="تنظیمات نمایش درس">
                    <MoreVertical size={20} />
                </Link>
            </header>

            <main className="mx-auto mt-4 flex w-full max-w-[430px] flex-1 flex-col gap-4">
                <Surface className="overflow-hidden p-0">
                    <div className="aspect-video w-full bg-slate-950">
                        <video
                            ref={videoRef}
                            controls
                            className="h-full w-full"
                            poster="/placeholder_video_poster.jpg"
                        >
                            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                        </video>
                    </div>
                </Surface>

                <Surface className="p-5">
                    {preferences.textDisplayMode !== "persian" && (
                        <h2 className="font-cjk font-black text-slate-950" style={chineseTextStyle} dir="ltr" lang="zh-CN">你好！</h2>
                    )}
                    {preferences.showPinyin && preferences.textDisplayMode !== "persian" && (
                        <p className="font-latin mt-2 text-sm text-slate-500" dir="ltr" lang="en">Nǐ hǎo! - درس {id}</p>
                    )}
                    {preferences.textDisplayMode !== "chinese" && (
                        <p className="mt-5 text-slate-600" style={persianTextStyle}>
                            در این درس با سلام و احوالپرسی‌های پایه در زبان چینی آشنا می‌شوی و چند عبارت کوتاه را تمرین می‌کنی.
                        </p>
                    )}
                </Surface>

                <Surface className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6ff] text-[#155aa6]">
                            <BookOpenText size={20} />
                        </div>
                        <h3 className="font-black text-slate-950">واژگان کلیدی</h3>
                    </div>
                    <ul className="space-y-3 text-sm" dir="ltr">
                        <li className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2">
                            <span><span className="font-cjk" style={chineseTextStyle} lang="zh-CN">你好</span> {preferences.showPinyin && <span className="font-latin" lang="en">(nǐ hǎo)</span>}</span>
                            <span className="text-slate-500">سلام</span>
                        </li>
                        <li className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2">
                            <span><span className="font-cjk" style={chineseTextStyle} lang="zh-CN">谢谢</span> {preferences.showPinyin && <span className="font-latin" lang="en">(xiè xie)</span>}</span>
                            <span className="text-slate-500">ممنون</span>
                        </li>
                    </ul>
                </Surface>
            </main>
        </div>
    );
}
