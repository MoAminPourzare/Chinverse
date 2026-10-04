import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ExploreItem } from "./exploreData";

export default function ExploreItemLink({ item }: { item: ExploreItem }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className="group flex min-h-16 items-center gap-3 rounded-2xl border border-transparent bg-[var(--app-canvas)] px-3 py-2.5 transition-colors hover:border-[var(--app-border)] hover:bg-[var(--app-primary-soft)] active:bg-[var(--app-primary-soft)]"
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                <Icon size={25} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span
                className="min-w-0 flex-1 text-right text-[14px] font-semibold leading-7 text-[var(--app-text)]"
                lang={item.id === "hsk" ? "en" : undefined}
                dir={item.id === "hsk" ? "ltr" : undefined}
            >
                {item.title}
            </span>
            <ChevronLeft size={17} strokeWidth={1.7} className="shrink-0 text-[var(--app-text-faint)] transition-colors group-hover:text-[var(--app-primary)]" aria-hidden="true" />
        </Link>
    );
}
