"use client";

import Image from "@/components/ui/PublicMediaImage";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import ActivitiesFeed from "@/components/home/ActivitiesFeed";
import { cn } from "@/lib/cn";
import DailyPracticeContent from "@/components/daily/DailyPracticeContent";

type HomeTab = "activities" | "daily";

const homeTabs: Array<{ id: HomeTab; label: string }> = [
    { id: "activities", label: "فعالیت‌ها" },
    { id: "daily", label: "روند یادگیری" },
];

export default function HomePage() {
    return <Suspense fallback={<div className="min-h-full bg-[#fafafb]" />}><HomeContent /></Suspense>;
}

function HomeContent() {
    const requestedTab = useSearchParams().get("tab");
    const [selectedTab, setActiveTab] = useState<HomeTab | null>(null);
    const activeTab = selectedTab ?? (requestedTab === "daily" ? "daily" : "activities");

    return (
        <div className="min-h-full bg-[#fafafb] pb-24" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col px-4 pt-4">
                <header className="flex flex-col items-center">
                    <Image
                        src="/assets/chinverse/logos/chinverse-wordmark.png"
                        alt="چین ورس"
                        width={190}
                        height={83}
                        className="h-auto w-[190px] object-contain"
                        priority
                    />

                    <div className="mt-3 grid h-[48px] w-full grid-cols-2 border-b border-[#c8d0dc]">
                        {homeTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative text-center text-[15px] font-black transition focus:outline-none",
                                    activeTab === tab.id ? "text-[#155aa6]" : "text-slate-700",
                                )}
                            >
                                {tab.label}
                                <span
                                    className={cn(
                                        "absolute bottom-[-1px] left-0 right-0 mx-auto h-[3px] w-full rounded-full transition",
                                        activeTab === tab.id ? "bg-[#155aa6] shadow-[0_5px_9px_rgba(21,90,166,0.28)]" : "bg-transparent",
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </header>

                {activeTab === "daily" ? (
                    <section
                        key="daily"
                        className="tab-content-motion mt-5 [&>div]:min-h-0 [&>div]:bg-transparent [&>div]:pb-0 [&_main]:max-w-none [&_main]:px-0 [&_main]:py-0"
                    >
                        <DailyPracticeContent />
                    </section>
                ) : (
                    <ActivitiesFeed />
                )}
            </main>
        </div>
    );
}
