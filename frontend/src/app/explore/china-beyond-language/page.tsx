"use client";

import { ChevronLeft } from "lucide-react";
import Image from "@/components/ui/PublicMediaImage";
import Link from "@/components/ui/ReturnAwareLink";
import { BackButton } from "@/components/ui/IconButton";
import { useReturnTo } from "@/hooks/useReturnTo";
import styles from "@/components/explore/ExploreGallery.module.css";

export default function ChinaBeyondLanguagePage() {
    const returnTo = useReturnTo("/explore/groups/culture");
    return (
        <div className={styles.page} data-tone="amber" dir="rtl">
            <main className={styles.main}>
                <header data-page-header className={styles.groupHeader}>
                    <div className={styles.groupToolbar} dir="ltr">
                        <BackButton href="/explore/groups/culture" label="بازگشت به فرهنگ و اندیشه" />
                        <h1 className={styles.groupTitle} dir="rtl">چین، فراتر از زبان</h1>
                        <span aria-hidden />
                    </div>
                </header>
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
