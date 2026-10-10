import Link from "@/components/ui/ReturnAwareLink";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import type { ExploreItem } from "./exploreData";
import styles from "./ExploreGallery.module.css";

export default function ExploreItemLink({ item, layout = "row", preload = false, eager = false }: {
    item: ExploreItem;
    layout?: "tile" | "row";
    preload?: boolean;
    eager?: boolean;
}) {
    return (
        <Link
            href={item.href}
            className={`${styles.card} ${styles[layout]} ${item.scene ? styles.scene : ""}`}
            data-tone={item.tone}
            dir="ltr"
        >
            <span className={styles.content} dir="rtl">
                <span className={styles.itemTitle} lang={item.id === "hsk" ? "en" : undefined} dir={item.id === "hsk" ? "ltr" : undefined}>
                    {item.title}
                </span>
                <span className={styles.description}>{item.description}</span>
                <span className={styles.arrow} aria-hidden="true"><ChevronLeft size={17} strokeWidth={2} /></span>
            </span>
            <span className={styles.picture} aria-hidden="true">
                <Image
                    src={item.imagePath}
                    alt=""
                    fill
                    sizes={layout === "tile" ? "(max-width: 430px) 29vw, 125px" : "(max-width: 430px) 49vw, 205px"}
                    preload={preload}
                    loading={preload ? undefined : eager ? "eager" : "lazy"}
                    className={styles.image}
                    style={{ objectPosition: item.imagePosition || "center" }}
                />
            </span>
        </Link>
    );
}
