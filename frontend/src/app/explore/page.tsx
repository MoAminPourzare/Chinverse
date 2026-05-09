"use client";

import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import Surface from "@/components/ui/Surface";
import { exploreSections, type ExploreItem } from "@/components/explore/exploreData";

export default function ExplorePage() {
    return (
        <div className="min-h-full pb-28" dir="rtl">
            <main className="mx-auto flex w-full flex-col gap-4 px-4 py-4">
                <Surface className="overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#334155_100%)] text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <div className="relative p-5">
                        <div className="absolute -left-12 top-0 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl" />
                        <div className="absolute -bottom-20 right-12 h-52 w-52 rounded-full bg-emerald-400/15 blur-3xl" />
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80">
                                <Compass size={14} />
                                کاوش
                            </div>
                            <h1 className="mt-4 text-2xl font-black leading-9 tracking-tight">
                                مسیر مناسب خودت را سریع پیدا کن
                            </h1>
                            <p className="mt-3 text-sm leading-7 text-white/72">
                                دسته ها فشرده تر و مرتب تر شده اند تا بدون اسکرول زیاد، مسیرها را ببینی و هر گروه را جداگانه باز کنی.
                            </p>
                        </div>
                    </div>
                </Surface>

                <div className="space-y-4">
                    {exploreSections.map((section) => (
                        <Surface key={section.id} className="overflow-hidden p-4">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-9 w-1.5 rounded-full bg-gradient-to-b ${section.tone}`} />
                                        <div>
                                            <h2 className="text-lg font-black tracking-tight text-slate-950">{section.title}</h2>
                                            <p className="mt-1 text-xs leading-5 text-slate-500">{section.subtitle}</p>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={`/explore/groups/${section.id}`}
                                    className="shrink-0 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100"
                                >
                                    مشاهده همه
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {section.items.slice(0, 4).map((item) => (
                                    <ExploreCompactCard key={item.id} item={item} />
                                ))}
                            </div>
                        </Surface>
                    ))}
                </div>

                <Surface className="overflow-hidden bg-slate-950 p-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-200">
                            <Sparkles size={23} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-black">تازه ها و پیشنهادها</h2>
                            <p className="mt-1 text-xs leading-5 text-white/60">
                                محتوای تازه بعد از اضافه شدن درس ها اینجا قابل نمایش است.
                            </p>
                        </div>
                    </div>
                </Surface>
            </main>
        </div>
    );
}

function ExploreCompactCard({ item }: { item: ExploreItem }) {
    const Icon = item.icon;

    return (
        <Link href={item.href} className="group min-w-0">
            <div className="flex min-h-[96px] flex-col justify-between rounded-[24px] border border-slate-100 bg-slate-50/80 p-3 transition group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                    <Icon size={23} strokeWidth={2.3} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-900">{item.title}</h3>
                    <ArrowRight size={15} className="shrink-0 text-slate-300 transition group-hover:text-rose-500" />
                </div>
            </div>
        </Link>
    );
}
