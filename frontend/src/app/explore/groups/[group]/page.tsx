"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { getExploreSection, type ExploreItem } from "@/components/explore/exploreData";

export default function ExploreGroupPage() {
    const params = useParams();
    const group = String(params.group || "");
    const section = getExploreSection(group);

    if (!section) {
        notFound();
    }

    return (
        <div className="min-h-full pb-28" dir="rtl">
            <main className="mx-auto flex w-full flex-col gap-4 px-4 py-4">
                <Surface className={`overflow-hidden bg-gradient-to-br ${section.tone} p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]`}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <Link
                            href="/explore"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white/90 transition hover:bg-white/20 hover:text-white"
                            aria-label="بازگشت به کاوش"
                        >
                            <ArrowRight size={19} />
                        </Link>
                        <p className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/75">
                            مشاهده همه
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-white/20 bg-white/15">
                            <Compass size={26} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="mt-1 text-2xl font-black tracking-tight">{section.title}</h1>
                            <p className="mt-2 text-sm leading-6 text-white/75">{section.subtitle}</p>
                        </div>
                    </div>
                </Surface>

                <div className="grid grid-cols-2 gap-3">
                    {section.items.map((item) => (
                        <ExploreGridCard key={item.id} item={item} />
                    ))}
                </div>
            </main>
        </div>
    );
}

function ExploreGridCard({ item }: { item: ExploreItem }) {
    const Icon = item.icon;

    return (
        <Link href={item.href} className="group min-w-0">
            <Surface className="flex min-h-[132px] flex-col justify-between p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
                <div className={`flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                    <Icon size={27} strokeWidth={2.25} />
                </div>
                <div className="mt-4">
                    <h2 className="line-clamp-2 text-base font-black leading-6 text-slate-950">{item.title}</h2>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                        ورود به بخش
                        <ArrowRight size={14} />
                    </div>
                </div>
            </Surface>
        </Link>
    );
}
