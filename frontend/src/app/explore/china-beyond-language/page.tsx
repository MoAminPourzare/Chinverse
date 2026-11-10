"use client";

import { ChevronLeft } from "lucide-react";
import Image from "@/components/ui/PublicMediaImage";
import Link from "@/components/ui/ReturnAwareLink";
import { AppHeader } from "@/components/ui/IconButton";
import { useReturnTo } from "@/hooks/useReturnTo";
import styles from "@/components/explore/ExploreGallery.module.css";

export default function ChinaBeyondLanguagePage() {
    const returnTo = useReturnTo("/explore/groups/culture");
    return (
        <div className={styles.page} data-tone="amber" dir="rtl">
            <main className={styles.main}>
                <AppHeader title="چین، فراتر از زبان" backHref="/explore/groups/culture" backLabel="بازگشت به فرهنگ و اندیشه" className="mb-0" />
                <section className={styles.soonPanel} aria-labelledby="coming-soon-title">
                    <Image src="/assets/chinverse/explore/v4/china-beyond-language.webp" alt="" width={640} height={427}
                        sizes="240px" preload className={styles.soonArtwork} />
                    <h2 id="coming-soon-title" className={styles.soonTitle}>به‌زودی</h2>
                    <p className={styles.soonDescription}>اینجا از زندگی مردم، شهرها و جلوه‌های فرهنگ چین بیشتر خواهیم گفت. محتوای این بخش به‌زودی اضافه می‌شود.</p>
                    <Link back href={returnTo} className={styles.soonBack}>بازگشت به موضوع‌ها<ChevronLeft size={16} aria-hidden /></Link>
                </section>
            </main>
        </div>
    );
}
