"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exploreSections } from "@/components/explore/exploreData";
import ExploreItemLink from "@/components/explore/ExploreItemLink";

export default function ExplorePage() {
    return (
        <div className="min-h-full bg-[var(--app-canvas)] pb-8" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-5 px-4 py-6">
                <header className="px-1">
                    <h1 className="text-[24px] font-bold leading-9 text-[var(--app-text)]">کاوش</h1>
                    <p className="mt-1 text-[13px] leading-6 text-[var(--app-text-muted)]">درس‌ها و موضوع‌های مورد علاقه‌ات را پیدا کن.</p>
                </header>
                {exploreSections.map((section) => (
                    <section key={section.id} aria-labelledby={`explore-${section.id}`} className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5">
                        <div className="mb-3 flex items-center justify-between gap-2 px-1">
                            <div className="min-w-0">
                                <h2 id={`explore-${section.id}`} className="text-[16px] font-bold leading-7 text-[var(--app-text)]">{section.title}</h2>
                                <p className="text-[12px] leading-6 text-[var(--app-text-muted)]">{section.items.length.toLocaleString("fa-IR")} موضوع</p>
                            </div>
                            <Link
                                href={`/explore/groups/${section.id}`}
                                aria-label={`مشاهده همهٔ ${section.title}`}
                                className="flex shrink-0 items-center gap-1 rounded-xl px-1.5 py-2 text-[12px] font-semibold text-[var(--app-primary)] transition-colors hover:bg-[var(--app-primary-soft)]"
                            >
                                مشاهده همه
                                <ChevronLeft size={15} aria-hidden="true" />
                            </Link>
                        </div>

                        <ul className="space-y-2">
                            {section.items.slice(0, 4).map((item) => (
                                <li key={item.id}><ExploreItemLink item={item} /></li>
                            ))}
                        </ul>
                    </section>
                ))}
            </main>
        </div>
    );
}
