"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { getJourneyHref, getSafeReturnTo } from "@/lib/returnTo";
import { useCurrentReturnPath } from "@/hooks/useReturnTo";

/** Carry the learning journey through collections and lessons, including query state. */
export default function ReturnAwareLink({ back = false, ...props }: ComponentProps<typeof Link> & { back?: boolean }) {
    const path = useCurrentReturnPath();
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    if (typeof props.href !== "string" || !props.href.startsWith("/") || !new URLSearchParams(query).has("returnTo")) return <Link {...props} />;
    if (back) return <Link {...props} href={getSafeReturnTo(query, props.href)} />;
    return <Link {...props} href={getJourneyHref(props.href, path)} />;
}
