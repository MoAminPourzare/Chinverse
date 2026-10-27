"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, UserRound } from "lucide-react";
import Image from "@/components/ui/PublicMediaImage";
import SafeBackButton from "@/components/ui/SafeBackButton";
import { AppHeader } from "@/components/ui/IconButton";
import api from "@/lib/api";
import { getMediaUrl } from "@/lib/media";

interface Identity { id: number; display_name: string | null; avatar_url: string | null }

export default function PublicProfilePage() {
    const params = useParams<{ id: string }>();
    return <PublicIdentity key={params.id} id={Number(params.id)} />;
}

function PublicIdentity({ id }: { id: number }) {
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        if (!Number.isSafeInteger(id) || id <= 0) return;
        api.get<Identity>(`/users/${id}/identity`, { signal: controller.signal }).then(response => setIdentity(response.data))
            .catch(() => { if (!controller.signal.aborted) setError(true); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [id]);
    return <div className="min-h-full bg-[#f3f8fc] p-5 dark:bg-[#10151c]" dir="rtl">
        <AppHeader title="پروفایل" backControl={<SafeBackButton fallback="/?tab=forum" />} icon={<UserRound size={23} />} />
        {loading && Number.isSafeInteger(id) && id > 0 ? <div role="status" aria-label="در حال دریافت پروفایل" className="flex min-h-60 items-center justify-center"><Loader2 className="size-7 animate-spin text-[#155aa6]" /></div> : error || !identity ? <p role="alert" className="mt-12 text-center text-sm text-slate-600 dark:text-slate-300">این پروفایل در دسترس نیست.</p> : <section className="mt-8 rounded-3xl bg-white p-8 text-center dark:bg-slate-800"><div className="relative mx-auto flex size-28 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#1688e8] bg-[#fffdf3]">{identity.avatar_url ? <Image src={getMediaUrl(identity.avatar_url)} alt="عکس پروفایل" fill sizes="112px" className="object-cover" unoptimized /> : <UserRound aria-hidden className="size-12 text-[#a4bfce]" />}</div><h2 className="mt-5 break-words text-xl font-black leading-9 text-[#20294e] dark:text-white" dir="auto">{identity.display_name || "زبان‌آموز چین‌ورس"}</h2></section>}
    </div>;
}
