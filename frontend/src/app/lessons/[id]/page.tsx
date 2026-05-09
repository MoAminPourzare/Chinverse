"use client";

import { useParams, useRouter } from "next/navigation";
import { BookOpenText, MoreVertical } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Surface from "@/components/ui/Surface";

export default function LessonPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    return (
        <div className="flex min-h-full flex-col px-4 pb-5 pt-4" dir="rtl">
            <PageHeader
                title={`درس ${id}`}
                subtitle="پخش و تمرین درس"
                onBack={() => router.back()}
                className="mx-0 shrink-0"
                endContent={
                    <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600">
                        <MoreVertical size={20} />
                    </button>
                }
            />

            <main className="mx-auto mt-4 flex w-full max-w-5xl flex-1 flex-col gap-4">
                <Surface className="overflow-hidden p-0">
                    <div className="aspect-video w-full bg-slate-950">
                        <video
                            controls
                            className="h-full w-full"
                            poster="/placeholder_video_poster.jpg"
                        >
                            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                        </video>
                    </div>
                </Surface>

                <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                    <Surface className="p-5">
                        <h2 className="font-cjk text-3xl font-black text-slate-950" dir="ltr" lang="zh-CN">你好！</h2>
                        <p className="font-latin mt-2 text-sm text-slate-500" dir="ltr" lang="en">Hello! - Lesson {id}</p>
                        <p className="mt-5 text-sm leading-8 text-slate-600">
                            در این درس با سلام و احوالپرسی‌های پایه در زبان چینی آشنا می‌شوی و چند عبارت کوتاه را تمرین می‌کنی.
                        </p>
                    </Surface>

                    <Surface className="p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 text-rose-500">
                                <BookOpenText size={20} />
                            </div>
                            <h3 className="font-bold text-slate-950">واژگان کلیدی</h3>
                        </div>
                        <ul className="space-y-3 text-sm" dir="ltr">
                            <li className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2">
                                <span><span className="font-cjk" lang="zh-CN">你好</span> <span className="font-latin" lang="en">(nǐ hǎo)</span></span>
                                <span className="text-slate-500">Hello</span>
                            </li>
                            <li className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2">
                                <span><span className="font-cjk" lang="zh-CN">谢谢</span> <span className="font-latin" lang="en">(xiè xie)</span></span>
                                <span className="text-slate-500">Thank you</span>
                            </li>
                        </ul>
                    </Surface>
                </div>
            </main>
        </div>
    );
}
