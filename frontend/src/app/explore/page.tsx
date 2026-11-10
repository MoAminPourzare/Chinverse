"use client";

import { exploreSections } from "@/components/explore/exploreData";
import ExploreSectionLink from "@/components/explore/ExploreSectionLink";
import styles from "@/components/explore/ExploreGallery.module.css";
import { AppHeader } from "@/components/ui/IconButton";
import { useReturnTo } from "@/hooks/useReturnTo";

export default function ExplorePage() {
    const returnTo = useReturnTo("/");
    return (
        <div className={styles.page} dir="rtl">
            <main className={styles.main}>
                {returnTo !== "/" ? <AppHeader title="کاوش" backHref={returnTo} className="mb-0" /> : <header data-page-header className={styles.header}>
                    <h1 className={styles.title}>کاوش</h1>
                    <p className={styles.subtitle}>چی دوست داری امروز یاد بگیری یا ببینی؟</p>
                </header>}
                <nav aria-label="دسته‌بندی‌های اصلی کاوش">
                    <ul className={styles.sections}>
                        {exploreSections.map((section, index) => (
                            <li key={section.id}><ExploreSectionLink section={section} preload={index === 0} /></li>
                        ))}
                    </ul>
                </nav>
            </main>
        </div>
    );
}
