"use client";

import Image from "@/components/ui/PublicMediaImage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookOpen, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/ui/IconButton";
import { fetchSavedCourses } from "@/lib/courses";
import { fetchSavedCollectionKeys } from "@/lib/savedCollections";
import { mergeSavedCollections, type SavedCollectionCard } from "@/lib/collectionCatalog";
import { getMediaUrl } from "@/lib/media";
import { authService } from "@/services/auth.service";

export default function SavedCollectionsPage() {
    const [collections, setCollections] = useState<SavedCollectionCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [guest, setGuest] = useState(false);
    const load = useCallback(async (signal?: AbortSignal) => {
        setLoading(true); setError(false);
        try {
            if (!await authService.restoreSession()) { if (!signal?.aborted) setGuest(true); return; }
            const [courses, keys] = await Promise.all([fetchSavedCourses(), fetchSavedCollectionKeys()]);
            if (!signal?.aborted) { setGuest(false); setCollections(mergeSavedCollections(courses, keys)); }
        } catch { if (!signal?.aborted) setError(true); }
        finally { if (!signal?.aborted) setLoading(false); }
    }, []);
    useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

    return <div className="min-h-full bg-[#f7f9fc] px-4 pb-8 pt-4 dark:bg-[#10151c]" dir="rtl">
        <AppHeader title="مجموعه‌های منتخب" backHref="/profile" icon={<Bookmark aria-hidden className="size-6 text-[#155aa6]" />} />
        <main className="mx-auto mt-6 max-w-[430px]">
            {loading ? <div role="status" className="flex min-h-60 items-center justify-center gap-3 text-sm text-slate-500"><Loader2 className="size-5 animate-spin" />در حال بارگذاری منتخب‌ها…</div>
            : error ? <div role="alert" className="py-10 text-center"><p className="text-sm text-slate-600 dark:text-slate-300">منتخب‌ها بارگذاری نشد.</p><button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-2xl bg-[#155aa6] px-5 text-sm font-bold text-white">تلاش دوباره</button></div>
            : guest ? <div className="py-10 text-center"><h1 className="font-bold text-slate-800 dark:text-white">مجموعه‌های خودت را ذخیره کن</h1><Link href="/login?next=%2Fprofile%2Fcollections" className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-[#155aa6] px-5 text-sm font-bold text-white">ورود به حساب</Link></div>
            : collections.length === 0 ? <div className="py-10 text-center"><Bookmark aria-hidden className="mx-auto size-12 text-[#a6bdd1]" /><h1 className="mt-5 text-lg font-black text-slate-900 dark:text-white">اولین مجموعه‌ات رو انتخاب کن!</h1><p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">در کاوش، نشانک مجموعه‌های مورد علاقه‌ات را بزن تا اینجا پیدایشان کنی.</p><Link href="/explore" className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-[#155aa6] px-5 text-sm font-bold text-white">کاوش کن</Link></div>
            : <div className="grid grid-cols-2 gap-3">{collections.map(collection => <article key={collection.key} className="overflow-hidden rounded-3xl border border-[#dbe7f2] bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800"><Link href={collection.href} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#155aa6]"><div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#eef6ff]">{collection.cover ? <Image src={collection.cover.startsWith("/assets/") ? collection.cover : getMediaUrl(collection.cover)} alt="" fill sizes="190px" className="object-cover" unoptimized /> : <BookOpen aria-hidden className="size-10 text-[#155aa6]" />}</div><h2 className="mt-3 line-clamp-2 text-sm font-black leading-6 text-slate-800 dark:text-white" dir="auto">{collection.title}</h2><p className="mb-2 mt-1 text-xs text-slate-500 dark:text-slate-300">{collection.countText}</p></Link></article>)}</div>}
        </main>
    </div>;
}
