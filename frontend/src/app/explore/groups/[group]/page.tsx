"use client";

import { notFound, useParams } from "next/navigation";
import { getExploreSection } from "@/components/explore/exploreData";
import ExploreItemLink from "@/components/explore/ExploreItemLink";
import { BackButton } from "@/components/ui/IconButton";
import styles from "@/components/explore/ExploreGallery.module.css";

export default function ExploreGroupPage() {
    const params = useParams();
    const group = String(params.group || "");
    const section = getExploreSection(group);

    if (!section) {
        notFound();
    }

    return (
        <div className={styles.page} dir="rtl">
            <main className={styles.main}>
                <header>
                    <div className={styles.groupHeader} dir="ltr">
                        <BackButton href="/explore" label="بازگشت به کاوش" />
                        <h1 className={styles.groupTitle} dir="rtl">{section.title}</h1>
                        <span aria-hidden />
                    </div>
                    <p className={styles.groupDescription}>{section.subtitle}</p>
                </header>

                <section aria-label={`موضوع‌های ${section.title}`} className={styles.panel}>
                    <p className={styles.groupCount}>{section.items.length.toLocaleString("fa-IR")} موضوع</p>
                    <ul className={section.id === "learning" ? styles.tiles : styles.list}>
                        {section.items.map((item, index) => (
                            <li key={item.id}><ExploreItemLink item={item} layout={section.id === "learning" ? "tile" : "row"} preload={index === 0} eager={index < (section.id === "learning" ? 6 : 4)} /></li>
                        ))}
                    </ul>
                </section>
            </main>
        </div>
    );
}
