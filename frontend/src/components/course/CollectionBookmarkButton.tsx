"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { checkCollectionSaved, getBookmarkErrorMessage, updateCollectionSaved, type BookmarkTarget } from "@/lib/savedCollections";
import { cn } from "@/lib/cn";

export default function CollectionBookmarkButton({ domain, slug, courseId }: BookmarkTarget) {
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setSaved(false);
        setError("");
        checkCollectionSaved({ domain, slug, courseId })
            .then((value) => { if (!cancelled) setSaved(value); })
            .catch((failure) => {
                if (!cancelled && failure?.response?.status !== 401) setError("وضعیت منتخب‌ها دریافت نشد؛ دوباره تلاش کن.");
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [domain, slug, courseId]);

    const toggle = async () => {
        if (loading || saving) return;
        setSaving(true);
        setError("");
        try {
            setSaved(await updateCollectionSaved({ domain, slug, courseId }, !saved));
        } catch (failure) {
            setError(getBookmarkErrorMessage(failure));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="relative">
            <button type="button" onClick={toggle} disabled={loading || saving}
                aria-label={saved ? "حذف از منتخب‌ها" : "ذخیره در منتخب‌ها"} aria-pressed={saved}
                className={cn("flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-wait disabled:opacity-60",
                    saved ? "bg-[#155aa6] text-white" : "text-[#333941] hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800")}
            >
                {loading || saving ? <Loader2 size={21} className="animate-spin" /> : saved ? <BookmarkCheck size={21} /> : <Bookmark size={21} />}
            </button>
            {error && <p role="alert" dir="rtl" className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-red-100 bg-white p-3 text-right text-xs font-bold leading-6 text-red-600 shadow-lg dark:bg-slate-900">{error}</p>}
        </div>
    );
}
