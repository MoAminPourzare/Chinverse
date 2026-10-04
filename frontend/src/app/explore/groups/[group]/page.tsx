"use client";

import { notFound, useParams } from "next/navigation";
import { getExploreSection } from "@/components/explore/exploreData";
import ExploreItemLink from "@/components/explore/ExploreItemLink";
import { BackButton } from "@/components/ui/IconButton";

export default function ExploreGroupPage() {
    const params = useParams();
    const group = String(params.group || "");
    const section = getExploreSection(group);

    if (!section) {
        notFound();
    }

    return (
        <div className="min-h-full bg-[var(--app-canvas)] pb-8" dir="rtl">
            <main className="mx-auto flex w-full max-w-[430px] flex-col gap-5 px-4 py-6">
                <header>
                    <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2" dir="ltr">
                        <BackButton href="/explore" label="بازگشت به کاوش" />
                        <h1 className="min-w-0 text-center text-[18px] font-bold leading-8 text-[var(--app-text)]" dir="rtl">{section.title}</h1>
                        <span aria-hidden />
                    </div>
                    <p className="mt-5 px-1 text-[13px] leading-7 text-[var(--app-text-muted)]">{section.subtitle}</p>
                </header>

                <section aria-label={`موضوع‌های ${section.title}`} className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5">
                    <p className="mb-3 px-1 text-[12px] leading-6 text-[var(--app-text-muted)]">{section.items.length.toLocaleString("fa-IR")} موضوع</p>
                    <ul className="space-y-2">
                        {section.items.map((item) => (
                            <li key={item.id}><ExploreItemLink item={item} /></li>
                        ))}
                    </ul>
                </section>
            </main>
        </div>
    );
}
