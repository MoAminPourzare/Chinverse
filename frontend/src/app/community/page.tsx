"use client";

import { Suspense } from "react";
import CommunityForum from "@/components/community/CommunityForum";

export default function CommunityPage() {
    return <Suspense fallback={<div role="status" className="p-6 text-center">در حال دریافت تالار گفتگو…</div>}><CommunityForum standalone /></Suspense>;
}
