"use client";

import Link from "@/components/ui/ReturnAwareLink";
import Image from "@/components/ui/PublicMediaImage";
import { ChevronLeft } from "lucide-react";
import { useCurrentReturnPath } from "@/hooks/useReturnTo";
import type { ExploreSection } from "./exploreData";
import styles from "./ExploreGallery.module.css";

export default function ExploreSectionLink({ section, preload = false }: { section: ExploreSection; preload?: boolean }) {
    const currentPath = useCurrentReturnPath();
    return (
        <Link href={`/explore/groups/${section.id}?returnTo=${encodeURIComponent(currentPath)}`}
            className={`${styles.card} ${styles.sectionCard}`} data-tone={section.tone} dir="ltr">
            <span className={styles.sectionContent} dir="rtl">
                <span className={styles.sectionTitle}>{section.title}</span>
                <span className={styles.sectionDescription}>{section.description}</span>
                <span className={styles.sectionFooter}>
                    <span className={styles.sectionCount}>{section.items.length.toLocaleString("fa-IR")} موضوع</span>
                    <span className={styles.sectionArrow} aria-hidden="true"><ChevronLeft size={18} /></span>
                </span>
            </span>
            <span className={styles.sectionPicture} aria-hidden="true">
                <Image src={section.iconPath} alt="" fill sizes="(max-width: 430px) 45vw, 185px"
                    preload={preload} loading={preload ? undefined : "eager"} className={styles.image} />
            </span>
        </Link>
    );
}
