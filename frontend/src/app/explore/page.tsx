"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exploreSections } from "@/components/explore/exploreData";
import ExploreItemLink from "@/components/explore/ExploreItemLink";
import styles from "@/components/explore/ExploreGallery.module.css";

export default function ExplorePage() {
    return (
        <div className={styles.page} dir="rtl">
            <main className={styles.main}>
                <header className={styles.header}>
                    <h1 className={styles.title}>کاوش</h1>
                    <p className={styles.subtitle}>چی دوست داری امروز یاد بگیری یا ببینی؟</p>
                </header>
                {exploreSections.map((section) => (
                    <section key={section.id} aria-labelledby={`explore-${section.id}`} className={styles.panel}>
                        <div className={styles.sectionHeader}>
                            <div className="min-w-0">
                                <h2 id={`explore-${section.id}`} className={styles.sectionTitle}>{section.title}</h2>
                                <p className={styles.count}>{section.items.length.toLocaleString("fa-IR")} موضوع</p>
                            </div>
                            <Link
                                href={`/explore/groups/${section.id}`}
                                aria-label={`مشاهده همهٔ ${section.title}`}
                                className={styles.viewAll}
                            >
                                مشاهده همه
                                <ChevronLeft size={15} aria-hidden="true" />
                            </Link>
                        </div>

                        <ul className={section.id === "learning" ? styles.tiles : styles.list}>
                            {section.items.slice(0, 4).map((item, index) => (
                                <li key={item.id}><ExploreItemLink item={item} layout={section.id === "learning" ? "tile" : "row"} preload={section.id === "learning" && index === 0} eager={section.id === "learning" || (section.id === "entertainment" && index === 0)} /></li>
                            ))}
                        </ul>
                    </section>
                ))}
            </main>
        </div>
    );
}
