"use client";

import Link from "@/components/ui/ReturnAwareLink";
import { ChevronLeft } from "lucide-react";
import { exploreSections } from "@/components/explore/exploreData";
import ExploreItemLink from "@/components/explore/ExploreItemLink";
import styles from "@/components/explore/ExploreGallery.module.css";
import { BackButton } from "@/components/ui/IconButton";
import { useReturnTo } from "@/hooks/useReturnTo";

export default function ExplorePage() {
    const returnTo = useReturnTo("/");
    return (
        <div className={styles.page} dir="rtl">
            <main className={styles.main}>
                <header data-page-header className={`${styles.header} relative`}>
                    {returnTo !== "/" && <BackButton href={returnTo} className="absolute left-0 top-1" />}
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
                            {(section.id === "entertainment" ? section.items : section.items.slice(0, 4)).map((item, index) => (
                                <li key={item.id}><ExploreItemLink item={item} layout={section.id === "learning" ? "tile" : "row"} preload={section.id === "learning" && index === 0} eager={section.id === "learning" || (section.id === "entertainment" && index === 0)} /></li>
                            ))}
                        </ul>
                    </section>
                ))}
            </main>
        </div>
    );
}
