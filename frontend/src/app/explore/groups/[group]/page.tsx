"use client";

import { notFound, useParams } from "next/navigation";
import Image from "@/components/ui/PublicMediaImage";
import { getExploreSection } from "@/components/explore/exploreData";
import ExploreItemLink from "@/components/explore/ExploreItemLink";
import { AppHeader } from "@/components/ui/IconButton";
import styles from "@/components/explore/ExploreGallery.module.css";

export default function ExploreGroupPage() {
    const params = useParams();
    const section = getExploreSection(String(params.group || ""));
    if (!section) notFound();

    return (
        <div className={styles.page} data-tone={section.tone} dir="rtl">
            <main className={styles.main}>
                <AppHeader title={section.title} backHref="/explore" backLabel="بازگشت به کاوش" className="mb-0" />
                <p className={styles.groupDescription}>{section.subtitle}</p>
                <figure className={styles.hero}>
                    <Image src={section.heroPath} alt={section.heroAlt} width={section.heroWidth} height={section.heroHeight}
                        sizes="(max-width: 430px) 93vw, 398px" preload className={styles.heroImage} />
                </figure>
                <section aria-label={`موضوع‌های ${section.title}`}>
                    <div className={styles.subjectHeader}>
                        <h2 className={styles.subjectTitle}>مسیرت را انتخاب کن</h2>
                        <span className={styles.groupCount}>{section.items.length.toLocaleString("fa-IR")} موضوع</span>
                    </div>
                    <ul className={styles.tiles}>
                        {section.items.map((item, index) => (
                            <li key={item.id} className={item.wide ? styles.wide : undefined}><ExploreItemLink item={item} eager={index < 4} /></li>
                        ))}
                    </ul>
                </section>
            </main>
        </div>
    );
}
