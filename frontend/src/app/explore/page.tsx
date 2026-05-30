"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { exploreSections, type ExploreItem } from "@/components/explore/exploreData";

export default function ExplorePage() {
    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28" dir="rtl">
            <main className="motion-list mx-auto flex w-full max-w-[430px] flex-col gap-5 px-4 py-5">
                {exploreSections.map((section) => (
                    <section key={section.id} className={`rounded-[24px] border p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${section.tone}`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-black leading-7 text-[#25272d]">{section.title}</h2>
                            </div>
                            <Link
                                href={`/explore/groups/${section.id}`}
                                className="shrink-0 rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-[11px] font-black text-[#155aa6] shadow-sm transition hover:bg-[#eef6ff]"
                            >
                                مشاهده همه
                            </Link>
                        </div>

                        <div className="motion-list grid grid-cols-2 gap-2">
                            {section.items.slice(0, 4).map((item) => (
                                <ExploreCompactCard key={item.id} item={item} />
                            ))}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
}

function ExploreCompactCard({ item }: { item: ExploreItem }) {
    const Icon = item.icon;

    return (
        <Link href={item.href} className="group min-w-0">
            <div className="flex h-[74px] items-center gap-2 rounded-[18px] border border-white/80 bg-white/86 px-3 shadow-[0_5px_16px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#d5e1ef] hover:bg-white">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br ${item.color} text-white shadow-[0_8px_16px_rgba(15,23,42,0.13)]`}>
                    <Icon size={20} strokeWidth={2.3} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[13px] font-black leading-5 text-slate-900">{item.title}</h3>
                </div>
                <ArrowLeft size={15} className="shrink-0 text-slate-300 transition group-hover:text-[#155aa6]" />
            </div>
        </Link>
    );
}
