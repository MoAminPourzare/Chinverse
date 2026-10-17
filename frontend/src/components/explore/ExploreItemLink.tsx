"use client";

import Link from "@/components/ui/ReturnAwareLink";
import Image from "@/components/ui/PublicMediaImage";
import { ChevronLeft } from "lucide-react";
import { useCurrentReturnPath } from "@/hooks/useReturnTo";
import type { ExploreItem } from "./exploreData";
import styles from "./ExploreGallery.module.css";

export default function ExploreItemLink({ item, eager = false }: { item: ExploreItem; eager?: boolean }) {
    const currentPath = useCurrentReturnPath();
    const edgeArtwork = ["china-beyond-language", "historical-stories", "series"].includes(item.id);
    return (
        <Link href={`${item.href}?returnTo=${encodeURIComponent(currentPath)}`}
            className={`${styles.card} ${styles.tile} ${item.wide ? styles.feature : ""} ${edgeArtwork ? styles.edgeArtwork : ""}`} data-tone={item.tone} dir="ltr">
            <span className={styles.content} dir="rtl">
                <span className={styles.itemTitle} lang={item.id === "hsk" ? "en" : undefined} dir={item.id === "hsk" ? "ltr" : undefined}>{item.title}</span>
                <span className={styles.description}>{item.description}</span>
                {item.comingSoon && <span className={styles.comingSoon}>به‌زودی</span>}
                <span className={styles.arrow} aria-hidden="true"><ChevronLeft size={17} strokeWidth={2} /></span>
            </span>
            <span className={styles.picture} aria-hidden="true">
                <Image src={item.imagePath} alt="" fill sizes={item.wide ? "(max-width: 430px) 47vw, 200px" : "(max-width: 430px) 38vw, 155px"}
                    loading={eager ? "eager" : "lazy"} className={styles.image} />
            </span>
        </Link>
    );
}
