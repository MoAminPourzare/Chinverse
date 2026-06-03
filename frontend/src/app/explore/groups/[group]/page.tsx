"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getExploreSection, type ExploreItem } from "@/components/explore/exploreData";
import { BackButton } from "@/components/ui/IconButton";

export default function ExploreGroupPage() {
    const params = useParams();
    const group = String(params.group || "");
    const section = getExploreSection(group);

    if (!section) {
        notFound();
    }

    return (
        <div className="min-h-full bg-[#f7f8fa] pb-28" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 py-5">
                <header className="rounded-[24px] border border-[#dfe6f0] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                    <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
                        <BackButton href="/explore" label="بازگشت به کاوش" className="justify-self-end" />
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-center text-[20px] font-black text-[#25272d]">{section.title}</h1>
                        </div>
                        <span aria-hidden />
                    </div>
                </header>

                <div className="motion-list grid grid-cols-2 gap-2">
                    {section.items.map((item) => (
                        <ExploreGroupCard key={item.id} item={item} />
                    ))}
                </div>
            </main>
        </div>
    );
}

function ExploreGroupCard({ item }: { item: ExploreItem }) {
    const Icon = item.icon;

    return (
        <Link href={item.href} className="group min-w-0">
            <div className="flex h-[74px] items-center gap-2 rounded-[18px] border border-white/80 bg-white/86 px-3 shadow-[0_5px_16px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#d5e1ef] hover:bg-white">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#155aa6] text-white shadow-[0_10px_18px_rgba(21,90,166,0.24)]">
                    <Icon size={20} strokeWidth={2.3} />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-[13px] font-black leading-5 text-slate-900">{item.title}</h2>
                </div>
                <ArrowLeft size={15} className="shrink-0 text-slate-300 transition group-hover:text-[#155aa6]" />
            </div>
        </Link>
    );
}
